/**
 * IMPORTS SECTION
 */
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
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
  setTeamNumber,
  setRobotName,
  runVision,
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
import { 
  findProsProjectFolders, 
  workspaceContainsProsProject,
  getProsTerminal,
  chooseProject,
  generateCCppFiles 
} from "./workspace_utils";
import { startPortMonitoring } from "./device";
import { BrainViewProvider } from "./views/brain-view";

/**
 * COMMAND BLOCKER SECTION
 */

// This is a map of commands to booleans. It is used to flag and block beta features.
export const commandsBlocker: { [key: string]: boolean } = {};

// This function is used to setup commands to be blocked. It is used to block beta features.
const setupCommandBlocker = async (
  cmd: string, // The command to block
  callback: Function, // The callback to run when the command is called
  context?: vscode.ExtensionContext, // The context to pass to the callback
  betaFeature?: boolean, // Whether or not the command is a beta feature
  customAnalytic?: string | null // The custom analytic to send when the command is called
) => {
  vscode.commands.registerCommand(cmd, async () => {
    if (
      betaFeature && // If the command is a beta feature
      !vscode.workspace 
        .getConfiguration("pros")
        .get("Beta: Enable Experimental Features") // And the user has not enabled beta features
    ) {
      vscode.window.showErrorMessage(
        "This feature is currently in beta. To enable it, set the 'pros.Beta: Enable Experimental Feature' setting in your workspace settings to true."
      ); // Show an error message asking them to enable beta features to use the requested feature
      return;
    }

    if (commandsBlocker[cmd]) {
      return; // If the command is already running, return
    }
    if (customAnalytic !== null) {
      analytics.sendAction(
        customAnalytic ? customAnalytic : cmd.replace("pros.", "")
      ); // Send the custom analytic if it exists, otherwise send the command name (without "pros." prefix)
    }
    commandsBlocker[cmd] = true; // Set the command to run
    if (context) {
      await callback(context); // Run the callback
    } else {
      await callback(); // Run the callback
    }
    commandsBlocker[cmd] = false; // Set the command to not running
  });
};

/**
 * GLOBAL VARIABLES SECTION
 */
let analytics: Analytics; // The analytics object
export var system: string; // The system the extension is running on 
export const output = vscode.window.createOutputChannel("PROS Output"); // The output channel used for PROS commands
export var prosLogger: Logger; // The logger object (imported from logger.ts)

/**
 * EXTENSION ACTIVATION FUNCTION (VERY IMPORTANT)
 */
export async function activate(context: vscode.ExtensionContext) {
  analytics = new Analytics(context);

  prosLogger = new Logger(context, "PROS_Extension_log", true, "useLogger");

  await configurePaths(context);

  workspaceContainsProsProject(true).then((isProsProject) => {
    vscode.commands.executeCommand(
      "setContext",
      "pros.isPROSProject",
      isProsProject
    );
    //This checks if user is currently working on a project, if not it allows user to select one
    if (isProsProject) {
      getProsTerminal(context).then((terminal) => {
        terminal.sendText("pros build-compile-commands");
      });
      generateCCppFiles();
    } else {
      chooseProject();
    }
  });

  startPortMonitoring(
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
  );

  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("showWelcomeOnStartup")
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

  setupCommandBlocker("pros.showterminal", async () => {
    try {
      const terminal = await getProsTerminal(context);
      terminal.show();
      vscode.window.showInformationMessage("PROS Terminal started!");
    } catch (err: any) {
      vscode.window.showErrorMessage(err.message);
    }
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
      .get<boolean>("showInstallOnStartup")
  ) {
    vscode.commands.executeCommand("pros.install");
  }

  // heuristic to add new files to the compilation database without requiring a full build
  vscode.workspace.onDidCreateFiles(async (event) => {
    // terminate early if there's no pros project or workspace folder open
    if (
      !(await workspaceContainsProsProject(true)) ||
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
};

/**
 * EXTENSION DEACTIVATION FUNCTION
 */
export function deactivate() {
  analytics.endSession();
};