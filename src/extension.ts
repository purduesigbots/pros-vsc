import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { opendocs } from "./views/docview";
import { promisify } from "util";

import { TreeDataProvider } from "./views/tree-view";
import {
  getWebviewContent,
  fetchCliVersion,
  fetchKernelVersionNonCLIDependent,
} from "./views/welcome-view";
import {
  buildUpload,
  clean,
  build,
  run,
  stop,
  createNewProject,
  upgradeProject,
  upload,
  capture,
  medic,
  updateFirmware,
  parseJSON,
  setTeamNumber,
  setRobotName,
  runVision,
  getCurrentKernelOkapiVersion,
} from "./commands";
import { ProsProjectEditorProvider } from "./views/editor";
import { Analytics } from "./ga";
import {
  install,
  configurePaths,
  uninstall,
  cleanup,
  installVision,
  uninstallVision,
  getOperatingSystem,
} from "./one-click/install";
import { getChildProcessProsToolchainPath } from "./one-click/path";
import { TextDecoder, TextEncoder } from "util";
import { Logger } from "./logger";

import { getCwdIsPros } from "./workspace";
import { startPortMonitoring } from "./device";
import { BrainViewProvider } from "./views/brain-view";
import { populateDocsJSON, debugDocsJson } from "./views/docs-webscrape";

export const commandsBlocker: { [key: string]: boolean } = {};

const setupCommandBlocker = async (
  cmd: string,
  callback: Function,
  context?: vscode.ExtensionContext,
  betaFeature?: boolean,
  customAnalytic?: string | null
) => {
  vscode.commands.registerCommand(cmd, async () => {
    if (
      betaFeature &&
      !vscode.workspace
        .getConfiguration("pros")
        .get("Beta: Enable Experimental Features")
    ) {
      vscode.window.showErrorMessage(
        "This feature is currently in beta. To enable it, set the 'pros.Beta: Enable Experimental Feature' setting in your workspace settings to true."
      );
      return;
    }

    if (commandsBlocker[cmd]) {
      return;
    }
    if (customAnalytic !== null) {
      analytics.sendAction(
        customAnalytic ? customAnalytic : cmd.replace("pros.", "")
      );
    }
    commandsBlocker[cmd] = true;
    if (context) {
      await callback(context);
    } else {
      await callback();
    }
    commandsBlocker[cmd] = false;
  });
};

let analytics: Analytics;

export var system: string;
export const output = vscode.window.createOutputChannel("PROS Output");

export var prosLogger: Logger;
export var mainPage: string =
  "https://purduesigbots.github.io/pros-doxygen-docs/api.html#autotoc_md1";
export var currentUrl: string = "https://";

/// Get a reference to the "PROS Terminal" VSCode terminal used for running
/// commands.

export const getProsTerminal = async (
  context: vscode.ExtensionContext
): Promise<vscode.Terminal> => {
  const prosTerminals = vscode.window.terminals.filter(
    (t) => t.name === "PROS Terminal"
  );
  if (prosTerminals.length > 1) {
    // Clean up duplicate terminals
    prosTerminals.slice(1).forEach((t) => t.dispose());
  }

  // Create a new PROS Terminal if one doesn't exist
  if (prosTerminals.length) {
    const options: Readonly<vscode.TerminalOptions> =
      prosTerminals[0].creationOptions;
    if (options?.env?.PATH?.includes("pros-cli")) {
      // Only keep the existing terminal if it has the correct path
      return prosTerminals[0];
    }
  }

  await configurePaths(context);

  return vscode.window.createTerminal({
    name: "PROS Terminal",
    env: process.env,
  });
};

export async function activate(context: vscode.ExtensionContext) {
  analytics = new Analytics(context);

  prosLogger = new Logger(context, "PROS_Extension_log", true, "Use Logger");

  const usingbeta =
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("Beta: Enable Experimental Features") ?? false;

  await configurePaths(context);

  await workspaceContainsProjectPros().then((isProsProject) => {
    vscode.commands.executeCommand(
      "setContext",
      "pros.isPROSProject",
      isProsProject
    );

    if (isProsProject) {
      getProsTerminal(context).then((terminal) => {
        terminal.sendText("pros build-compile-commands --no-analytics");
      });
      generateCCppFiles();
    } else {
      chooseProject();
    }
  });

  const projectVersions = await getCurrentKernelOkapiVersion();
  const projectKernelVersion = projectVersions?.curKernel;

  startPortMonitoring(
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
  );

  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("Show Welcome On Startup")
  ) {
    vscode.commands.executeCommand("pros.welcome");
  }

  setupCommandBlocker("pros.install", install, context);
  setupCommandBlocker("pros.uninstall", uninstall, context);
  setupCommandBlocker("pros.verify", cleanup, context);
  setupCommandBlocker("pros.batterymedic", medic, context);
  setupCommandBlocker("pros.updatefirmware", updateFirmware);

  setupCommandBlocker("pros.build&upload", buildUpload);
  setupCommandBlocker("pros.upload", upload);
  setupCommandBlocker("pros.build", build);
  setupCommandBlocker("pros.run", run);
  setupCommandBlocker("pros.stop", stop);
  setupCommandBlocker("pros.clean", clean);
  setupCommandBlocker("pros.capture", capture);
  setupCommandBlocker("pros.teamnumber", setTeamNumber);
  setupCommandBlocker("pros.robotname", setRobotName);

  setupCommandBlocker(
    "pros.opendocs",
    () => {
      debugDocsJson();
      if (currentUrl === "NONE") {
        currentUrl = mainPage;
      }
      opendocs(currentUrl);
    },
    undefined,
    true
  );

  setupCommandBlocker("pros.deleteLogs", prosLogger.deleteLogs);
  setupCommandBlocker("pros.openLog", prosLogger.openLog);

  setupCommandBlocker("pros.installVision", installVision, context, true);
  setupCommandBlocker("pros.uninstallVision", uninstallVision, context, true);
  setupCommandBlocker("pros.runVision", runVision, context, true);

  setupCommandBlocker(
    "pros.selectProject",
    chooseProject,
    undefined,
    undefined,
    null
  );

  setupCommandBlocker("pros.upgrade", upgradeProject);
  setupCommandBlocker("pros.new", createNewProject);

  setupCommandBlocker(
    "pros.terminal",
    async () => {
      try {
        const terminal = await getProsTerminal(context);
        terminal.sendText("pros terminal");
        terminal.show();
      } catch (err: any) {
        vscode.window.showErrorMessage(err.message);
      }
    },
    undefined,
    undefined,
    "serialterminal"
  );

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
        .get<boolean>("Enable Analytics") ?? false;
    const showWelcomeOnStartup =
      vscode.workspace
        .getConfiguration("pros")
        .get<boolean>("Show Welcome On Startup") ?? false;

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

  // if we are using beta and it is a pros 4 project

  console.log("current kernel version: " + projectKernelVersion ?? "undefined");
  if (
    usingbeta &&
    projectKernelVersion !== undefined &&
    projectKernelVersion.startsWith("4")
  ) {
    populateDocsJSON();
    vscode.languages.registerHoverProvider("*", {
      provideHover(document, position, token) {
        //will be needed for word lookup
        const line = document.lineAt(position);
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        // given our line, we need to check the namespace of what is being hovered:
        // split line.text by word

        const text = line.text;
        let namespace = text.split(word)[0].trim();

        // remove all :: from namespace and pros
        namespace = namespace.replace(/::/g, "");
        namespace = namespace.replace(/pros/g, "");

        console.log("Hover stuff: " + word + " " + namespace);
        var linkString: string = parseJSON(word, namespace);
        console.log(linkString);

        if (!linkString.includes("purduesigbots.github.io")) {
          currentUrl = "NONE";
          return;
        }

        currentUrl = linkString;

        const commentCommandUri = vscode.Uri.parse(`command:pros.opendocs`);
        let link = new vscode.MarkdownString(
          `[Go to PROS Documentation...](${commentCommandUri})`
        );
        link.isTrusted = true;

        let hover: vscode.Hover = {
          contents: [link],
        };
        return hover;
      },
    });
  }

  vscode.window.registerTreeDataProvider(
    "prosTreeview",
    new TreeDataProvider()
  );

  const brainViewProvider = new BrainViewProvider(
    context.extensionUri,
    !vscode.workspace
      .getConfiguration("pros")
      .get("Beta: Enable Experimental Features")
  );
  vscode.window.registerWebviewViewProvider(
    BrainViewProvider.viewType,
    brainViewProvider
  );

  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("Enable Auto Updates")
  ) {
    vscode.commands.executeCommand("pros.install");
  }

  // heuristic to add new files to the compilation database without requiring a full build
  vscode.workspace.onDidCreateFiles(async (event) => {
    // terminate early if there's no pros project or workspace folder open
    if (
      !(await workspaceContainsProjectPros()) ||
      !vscode.workspace.workspaceFolders
    ) {
      return;
    }

    const workspaceRootUri = vscode.workspace.workspaceFolders[0].uri;
    const compilationDbUri = vscode.Uri.joinPath(
      workspaceRootUri,
      "compile_commands.json"
    );
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
    const compilationDbData: [
      { arguments: string[]; directory: string; file: string }
    ] = JSON.parse(
      new TextDecoder().decode(
        await vscode.workspace.fs.readFile(compilationDbUri)
      )
    );

    let compilationDbDirty = false;

    const mainArgs = compilationDbData.find(
      (entry) => entry.file === "src/main.cpp"
    )?.arguments;

    // if for some reason there isn't an entry for main.cpp then i give up
    if (!mainArgs) {
      return;
    }

    for (let file of event.files) {
      // the cdb only has entries for source files
      if (file.fsPath.includes("src")) {
        // since the cdb encodes the file as a relative path we have to do the same for the files given to us by the event
        const thisFileRelative = path.relative(
          workspaceRootUri.path,
          file.path
        );

        // anyway, if there is already an entry for this file somehow, just skip it
        if (
          compilationDbData.find((entry) => entry.file === thisFileRelative)
        ) {
          continue;
        }

        // pop object file and source file from the compiler arguments list from the copy we saved of the args for main.cpp
        const [_objFile, _srcFile, ...args] = mainArgs.reverse();

        // create an entry for this file
        compilationDbData.push({
          arguments: [
            ...args.reverse(), // (re-reverse the arguments list)
            `${thisFileRelative.replace("src", "bin")}.o`, // sure hope there aren't users who have src/**/src/**/ in their projects...
            thisFileRelative,
          ],
          directory: workspaceRootUri.path,
          file: thisFileRelative,
        });

        // mark the cdb dirty
        compilationDbDirty = true;
      }
    }

    // write changes back to the cdb if there are any
    if (compilationDbDirty) {
      await vscode.workspace.fs.writeFile(
        compilationDbUri,
        new TextEncoder().encode(
          JSON.stringify(compilationDbData, undefined, 4)
        )
      );
    }
  });

  context.subscriptions.push(ProsProjectEditorProvider.register(context));
  prosLogger.deleteOldLogs();
}

export function deactivate() {
  analytics.endSession();
}

async function workspaceContainsProjectPros(): Promise<boolean> {
  return (await getCwdIsPros()) !== null;
}

//This code calls prosProjects and allows user to choose which pros project to work on
async function chooseProject() {
  if (
    vscode.workspace.workspaceFolders === undefined ||
    vscode.workspace.workspaceFolders === null
  ) {
    return;
  }
  var array = await prosProjects();
  if (array.length === 0) {
    vscode.window.showInformationMessage(
      "No PROS Projects found in current directory!"
    );
    return;
  }
  const targetOptions: vscode.QuickPickOptions = {
    placeHolder: array[0].name,
    title: "Select the PROS project to work on",
  };
  var folderNames: Array<vscode.QuickPickItem> = [];
  //Specify type for any
  for (const f of array) {
    folderNames.push({ label: f[0], description: "" });
  }

  // Display the options to users
  const target = await vscode.window.showQuickPick(folderNames, targetOptions);
  if (target === undefined) {
    throw new Error();
  }
  //This will open the folder the user selects
  await vscode.commands.executeCommand(
    "vscode.openFolder",
    vscode.Uri.file(
      path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, target.label)
    )
  );
}

//This function will return an array full of folder names containing pros project file
async function prosProjects() {
  //Specify type for any later
  var array: any = [];
  if (
    vscode.workspace.workspaceFolders === undefined ||
    vscode.workspace.workspaceFolders === null
  ) {
    console.log(vscode.workspace.workspaceFolders);
    return array;
  }
  console.log(vscode.workspace.workspaceFolders);

  for (const workspace of vscode.workspace.workspaceFolders) {
    const currentDir = workspace.uri;
    const folders = await vscode.workspace.fs.readDirectory(currentDir);
    for (const folder of folders) {
      var exists = true;
      try {
        // By using VSCode's stat function (and the uri parsing functions), this code should work regardless
        // of if the workspace is using a physical file system or not.
        const workspaceUri = vscode.Uri.file(
          path.join(currentDir.fsPath, folder[0])
        );
        const uriString = `${workspaceUri.scheme}:${
          workspaceUri.path
        }/${"project.pros"}`;
        const uri = vscode.Uri.parse(uriString);
        await vscode.workspace.fs.stat(uri);
      } catch (e) {
        console.error(e);
        exists = false;
      }
      if (exists) {
        array.push(folder);
      }
    }
  }
  console.log(array);
  return array;
}

const generateCCppFiles = async () => {
  if (!workspaceContainsProjectPros() || !vscode.workspace.workspaceFolders) {
    return;
  }

  // We will need to update this part with the new code in #110 once this all gets merged into develop. We can do a quick cleanup branch or something

  const workspaceRootUri = vscode.workspace.workspaceFolders[0].uri;

  const cCppPropertiesUri = vscode.Uri.joinPath(
    workspaceRootUri,
    ".vscode",
    "c_cpp_properties.json"
  );

  const os = getOperatingSystem();

  // if we are in a pros project

  let exists = true;
  console.log("does project.pros exist: " + exists);
  try {
    // By using VSCode's stat function (and the uri parsing functions), this code should work regardless
    // of if the workspace is using a physical file system or not.
    const workspaceUri = workspaceRootUri;
    const uriString = `${workspaceUri.scheme}:${
      workspaceUri.path
    }/${"project.pros"}`;
    const uri = vscode.Uri.parse(uriString);
    await vscode.workspace.fs.stat(uri);
  } catch (e) {
    console.error(e);
    exists = false;
  }

  if (exists || true) {
    const os = getOperatingSystem();
    let json;
    //check if the properties file exists
    console.log("checking if it exists");
    try {
      // check if the file exists
      let response = await vscode.workspace.fs.stat(cCppPropertiesUri);
      // do nothing
      let filedata = await promisify(fs.readFile)(
        cCppPropertiesUri.fsPath,
        "utf8"
      );
      json = JSON.parse(filedata);

      await modifyJson(workspaceRootUri, json, os);
    } catch (e) {
      // make the file
      console.log("generating file");

      const defaultJSON = `{
        "configurations": [
            {
                "name": "PROS Project",
                "includePath": [
                    "\${workspaceFolder}/**"
                ],
                "defines": [
                    "_DEBUG",
                    "UNICODE",
                    "_UNICODE"
                ],
                "compilerPath": "C:/Program Files (x86)/Microsoft Visual Studio/2017/BuildTools/VC/Tools/MSVC/14.16.27023/bin/Hostx64/x64/cl.exe",
                "cStandard": "c17",
                "cppStandard": "c++17",
                "intelliSenseMode": "windows-msvc-x64"
            }
        ],
        "version": 4
    }`;

      json = JSON.parse(defaultJSON);
      await modifyJson(workspaceRootUri, json, os);
    }
  }
};

const modifyJson = async (dirpath: vscode.Uri, json: any, os: string) => {
  //modify the json file then save it

  // if include is not already in the array
  let include = path.join(dirpath.fsPath, "include");
  if (!json.configurations[0].includePath.includes(include)) {
    json.configurations[0].includePath.push(include);
  }
  json.configurations[0].compileCommands = path.join(
    dirpath.fsPath,
    "compile_commands.json"
  );
  json.configurations[0].intelliSenseMode = "gcc-arm";
  if (os === "macos") {
    json.configurations[0].macFrameworkPath = ["/System/Library/Frameworks"];
  }

  json.configurations[0].browse = {
    path: [dirpath.fsPath],
    limitSymbolsToIncludedHeaders: true,
    databaseFilename: "",
  };

  let toolchain = getChildProcessProsToolchainPath();
  if (toolchain !== undefined) {
    json.configurations[0].compilerPath = path.join(
      toolchain.replace(/"/g, ""),
      "bin",
      "arm-none-eabi-g++"
    );
  }

  try {
    fs.statSync(path.join(dirpath.fsPath, ".vscode"));
  } catch (error) {
    await promisify(fs.mkdir)(path.join(dirpath.fsPath, ".vscode"));
  }

  await promisify(fs.writeFile)(
    path.join(dirpath.fsPath, ".vscode", "c_cpp_properties.json"),
    JSON.stringify(json, null, 2)
  );
};
