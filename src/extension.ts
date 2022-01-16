import * as vscode from "vscode";
import * as path from "path";

import { TreeDataProvider } from "./views/tree-view";
import {
  getWebviewContent,
  fetchKernelVersion,
  fetchCliVersion,
  fetchKernelVersionNonCLIDependent,
} from "./views/welcome-view";
import {
  buildUpload,
  clean,
  build,
  createNewProject,
  upgradeProject,
  upload,
} from "./commands";
import { ProsProjectEditorProvider } from "./views/editor";
import { Analytics } from "./ga";
import { install } from "./one-click/install";
import { TextDecoder, TextEncoder } from "util";

let analytics: Analytics;

export function activate(context: vscode.ExtensionContext) {
  analytics = new Analytics(context);

  workspaceContainsProjectPros().then((value) => {
    vscode.commands.executeCommand("setContext", "pros.isPROSProject", value);
  });

  const terminal = vscode.window.createTerminal("PROS Terminal");
  terminal.sendText("pros build-compile-commands");

  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("showWelcomeOnStartup")
  ) {
    vscode.commands.executeCommand("pros.welcome");
  }
  vscode.commands.registerCommand("pros.install", async () => {
    await install(context);
  });
  vscode.commands.registerCommand("pros.upload&build", async () => {
    analytics.sendAction("upload&build");
    await vscode.commands.executeCommand("pros.build");
    await vscode.commands.executeCommand("pros.upload");
  });

  vscode.commands.registerCommand("pros.upload", async () => {
    analytics.sendAction("upload");
    await upload();
  });

  vscode.commands.registerCommand("pros.build", async () => {
    analytics.sendAction("build");
    await build();
  });

  vscode.commands.registerCommand("pros.clean", clean);

  vscode.commands.registerCommand("pros.terminal", () => {
    terminal.show();
    terminal.sendText("pros terminal");
  });

  vscode.commands.registerCommand("pros.upgrade", () => {
    analytics.sendAction("upgrade");
    upgradeProject();
  });

  vscode.commands.registerCommand("pros.new", () => {
    analytics.sendAction("projectCreated");
    createNewProject();
  });

  vscode.commands.registerCommand("pros.welcome", async () => {
    analytics.sendPageview("welcome");
    const panel = vscode.window.createWebviewPanel(
      "welcome",
      "Welcome",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.iconPath = vscode.Uri.file(
      path.join(context.extensionPath, "media", "pros-color-icon.png")
    );

    const onDiskPath = vscode.Uri.file(
      path.join(context.extensionPath, "media", "welcome.css")
    );

    const cssPath = panel.webview.asWebviewUri(onDiskPath);
    const imgHeaderPath = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "pros-horiz-white.png")
      )
    );
    const imgIconPath = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "tree-view.png")
      )
    );
    const imgActionPath = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "quick-action.png")
      )
    );
    const imgProjectProsPath = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "project-view.png")
      )
    );
    const jsPath = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "media", "welcome.js"))
    );

    const newKernel = await fetchKernelVersionNonCLIDependent();
    const newCli = await fetchCliVersion();

    const useGoogleAnalytics =
      vscode.workspace
        .getConfiguration("pros")
        .get<boolean>("useGoogleAnalytics") ?? false;
    const showWelcomeOnStartup =
      vscode.workspace
        .getConfiguration("pros")
        .get<boolean>("showWelcomeOnStartup") ?? false;

    panel.webview.html = getWebviewContent(
      cssPath,
      jsPath,
      imgHeaderPath,
      imgIconPath,
      imgActionPath,
      imgProjectProsPath,
      newKernel,
      newCli,
      useGoogleAnalytics,
      showWelcomeOnStartup,
      context
    );

    panel.webview.onDidReceiveMessage(async (message) => {
      await vscode.workspace
        .getConfiguration("pros")
        .update(message.command, message.value, true);
    });
  });

  vscode.window.registerTreeDataProvider(
    "prosTreeview",
    new TreeDataProvider()
  );

  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("showInstallOnStartup")
  ) {
    install(context);
  }
  
  // heuristic to add new files to the compilation database without requiring a full build
  vscode.workspace.onDidCreateFiles(async (event) => {
    // terminate early if there's no pros project or workspace folder open
    if (!await workspaceContainsProjectPros() || !vscode.workspace.workspaceFolders) {
      return;
    }
    
    const workspaceRootUri = vscode.workspace.workspaceFolders[0].uri;
    const compilationDbUri = vscode.Uri.joinPath(workspaceRootUri, 'compile_commands.json');
    
    // first check if the cdb exists. if not, attempt to build the project to generate it
    try {
      await vscode.workspace.fs.stat(compilationDbUri);
    } catch {
      await vscode.commands.executeCommand("pros.clean");
      await vscode.commands.executeCommand("pros.build");

      // after building, check for cdb again. if still not present then just abandon the heuristic
      try {
        await vscode.workspace.fs.stat(compilationDbUri);
      } catch {
        return;
      }
    }

    // now we know there is a cdb present, we can load it
    const compilationDbData: [{arguments: string[], directory: string, file: string}] = JSON.parse(
      new TextDecoder().decode(
        await vscode.workspace.fs.readFile(compilationDbUri)
      )
    );

    let compilationDbDirty = false;

    const mainArgs = compilationDbData.find((entry) => entry.file === "src/main.cpp")?.arguments;

    // if for some reason there isn't an entry for main.cpp then i give up
    if (!mainArgs) {
      return;
    }

    for (let file of event.files) {
      // the cdb only has entries for source files
      if (file.fsPath.includes("src")) {
        // since the cdb encodes the file as a relative path we have to do the same for the files given to us by the event
        const thisFileRelative = path.relative(workspaceRootUri.path, file.path);

        // anyway, if there is already an entry for this file somehow, just skip it
        if (compilationDbData.find((entry) => entry.file === thisFileRelative)) {
          continue;
        }

        // pop object file and source file from the compiler arguments list from the copy we saved of the args for main.cpp
        const [_objFile, _srcFile, ...args] = mainArgs.reverse();

        // create an entry for this file
        compilationDbData.push({
          arguments: [
            ...args.reverse(),                             // (re-reverse the arguments list)
            `${thisFileRelative.replace('src', 'bin')}.o`, // sure hope there aren't users who have src/**/src/**/ in their projects...
            thisFileRelative
          ],
          directory: workspaceRootUri.path,
          file: thisFileRelative
        });

        // mark the cdb dirty
        compilationDbDirty = true;
      }
    }

    // write changes back to the cdb if there are any
    if (compilationDbDirty) {
      await vscode.workspace.fs.writeFile(compilationDbUri, new TextEncoder().encode(JSON.stringify(compilationDbData, undefined, 4)));
    }
  });

  context.subscriptions.push(ProsProjectEditorProvider.register(context));
}

export function deactivate() {
  analytics.endSession();
}

async function workspaceContainsProjectPros(): Promise<boolean> {
  const filename = "project.pros";

  if (
    vscode.workspace.workspaceFolders === undefined ||
    vscode.workspace.workspaceFolders === null
  ) {
    return false;
  }

  let exists = true;
  try {
    // By using VSCode's stat function (and the uri parsing functions), this code should work regardless
    // of if the workspace is using a physical file system or not.
    const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    const uriString = `${workspaceUri.scheme}:${workspaceUri.path}/${filename}`;
    const uri = vscode.Uri.parse(uriString);
    await vscode.workspace.fs.stat(uri);
  } catch (e) {
    console.error(e);
    exists = false;
  }
  return exists;
}
