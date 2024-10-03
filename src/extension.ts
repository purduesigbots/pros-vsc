/**
 * IMPORTS SECTION
 */
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { opendocs } from "./views/docview";
import { promisify } from "util";
import { TreeDataProvider } from "./views/tree-view";
import {
  getWebviewContent,
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
  infoProject,
  upload,
  capture,
  medic,
  updateFirmware,
  parseJSON,
  setTeamNumber,
  setRobotName,
  runVision,
  getCurrentKernelOkapiVersion,
  resetConductor,
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
  generateCCppFiles,
} from "./workspace_utils";
import { startPortMonitoring } from "./device";
import { BrainViewProvider } from "./views/brain-view";
import { populateDocsJSON, debugDocsJson } from "./views/docs-webscrape";
import { getCurrentReleaseVersion } from "./one-click/installed";

/**
 * COMMAND BLOCKER SECTION
 */

// This is a map of command names to a boolean representing whether or not the command is currently running
export const commandsBlocker: { [key: string]: boolean } = {};

/**
 * This function is used to ensure safe running of commands. It prevents simultaneous execution of the same command,
 * and prevents execution of beta features if the user has not enabled beta features. Additionally, it sets up analytics.
 *
 * @param cmd The command to setup
 * @param callback The callback to run when the command is called
 * @param context Vscode extension context (optional, provide if the callback requires it)
 * @param betaFeature Whether or not this feature is in beta (optional, defaults to not beta)
 * @param customAnalytic Message to send to analytics. Defaults to the command name without "pros." in it. Pass null to disable analytics.
 */
const setupCommandBlocker = async (
  cmd: string, // The command to setup
  callback: Function, // The callback to run when the command is called
  context?: vscode.ExtensionContext, // The extension context to pass to the callback
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
      return; // If the map says the command is already running, don't run it again
    }
    if (customAnalytic !== null) {
      analytics.sendAction(
        customAnalytic ? customAnalytic : cmd.replace("pros.", "")
      ); // Send analytics unless disabled. Default to command name (minus the pros. prefix), if there is a custom analytic provided, use it.
    }
    commandsBlocker[cmd] = true; // Note that the command is going to run in the map
    if (context) {
      await callback(context); // Run the callback
    } else {
      await callback(); // Run the callback
    }
    commandsBlocker[cmd] = false;
  });
};

export var mainPage: string =
  "https://purduesigbots.github.io/pros-doxygen-docs/api.html#autotoc_md1";
export var currentUrl: string = "https://";

export var betaFeaturesEnabled: boolean = false;
/// Get a reference to the "PROS Terminal" VSCode terminal used for running
/// commands.

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
  // Init analytics and logger
  analytics = new Analytics(context);

  prosLogger = new Logger(context, "PROS_Extension_log", true, "Use Logger");

  // Check if beta features are enabled
  betaFeaturesEnabled =
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("Beta: Enable Experimental Features") ?? false;

  vscode.commands.executeCommand(
    "setContext",
    "pros.betaFeaturesEnabled",
    betaFeaturesEnabled
  );

  // Sets up paths for integrated terminal (context is the vscode extension context)
  await configurePaths(context);

  // If we are in a pros project, set the variable which tracks that to true and set everything up
  workspaceContainsProsProject(true).then((isProsProject) => {
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

  startPortMonitoring(
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
  );

  // Display PROS welcome page if that setting is enabled
  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("Show Welcome On Startup")
  ) {
    vscode.commands.executeCommand("pros.welcome");
  }

  //Display pop-up to enable autosave
  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("promptautosave")
  ) {
    vscode.window
      .showInformationMessage(
        "Would you like to enable autosave for this PROS project?",
        "Enable Autosave",
        "Not now",
        "Never"
      )
      .then((selection) => {
        if (selection === "Enable Autosave") {
          vscode.workspace
            .getConfiguration("files")
            .update("autoSave", "afterDelay", false);
          vscode.workspace
            .getConfiguration("pros")
            .update("promptautosave", false, false);
        } else if (selection === "Never") {
          vscode.workspace
            .getConfiguration("pros")
            .update("promptautosave", false, false);
        }
      });
  }

  // Set up all commands to run with the command blocker (see near the top of this file to understand what it does)
  // Commands with basic/default options:
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

  setupCommandBlocker("pros.deleteLogs", () => {
    prosLogger.deleteLogs();
  });
  setupCommandBlocker("pros.openLog", () => {
    prosLogger.openLog();
  });
  setupCommandBlocker(
    "pros.selectProject",
    chooseProject,
    undefined,
    undefined,
    null
  );

  setupCommandBlocker("pros.upgrade", upgradeProject);
  setupCommandBlocker("pros.new", createNewProject);
  setupCommandBlocker("pros.infoProject", infoProject);
  setupCommandBlocker("pros.resetConductor", resetConductor);

  // Beta commands (notice the fourth argument is set to true for these)
  setupCommandBlocker("pros.installVision", installVision, context, true);
  setupCommandBlocker("pros.uninstallVision", uninstallVision, context, true);
  setupCommandBlocker("pros.runVision", runVision, context, true);

  // PROS Terminal setup command:
  setupCommandBlocker(
    "pros.terminal", // Name of command to execute
    async () => {
      // This is the callback function.
      try {
        // Try to setup pros terminal
        const terminal = await getProsTerminal(context);
        terminal.sendText("pros terminal");
        terminal.show();
      } catch (err: any) {
        // If there is an error, show an error message
        vscode.window.showErrorMessage(err.message);
      }
    },
    undefined, // This is the context, which is undefined because we don't need it
    undefined, // This is the beta feature flag, which is undefined because this is not a beta feature
    "serialterminal" // This is the custom analytic, which is "serialterminal" so as to be more specific than "terminal"
  );

  // PROS Terminal opener command:
  setupCommandBlocker(
    "pros.showterminal", // Name of command to execute
    async () => {
      // This is the callback function.
      try {
        // Try to show pros terminal
        const terminal = await getProsTerminal(context);
        terminal.show();
        vscode.window.showInformationMessage("PROS Terminal started!");
      } catch (err: any) {
        // If there is an error, show an error message
        vscode.window.showErrorMessage(err.message);
      }
    }
  );

  // if we are using beta
  if (betaFeaturesEnabled) {
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

        var linkString: string = parseJSON(word, namespace);

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

  // PROS Welcome page command:
  vscode.commands.registerCommand(
    "pros.welcome", // Name of command to execute
    async () => {
      // This is the callback function.
      // Send analytics pageview (what is this lol)
      analytics.sendPageview("welcome");
      const panel = vscode.window.createWebviewPanel(
        // Creates the welcome page object
        "welcome",
        "Welcome",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      // SETUP ALL IMAGES AND STYLESHEETS AND SCRIPTS FOR THE WELCOME PAGE:

      // This is the path to the icon for the welcome page
      panel.iconPath = vscode.Uri.file(
        path.join(context.extensionPath, "media", "pros-color-icon.png")
      );

      // This is the path to the stylesheet for the welcome page
      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, "media", "welcome.css")
      );

      // Converts the stylesheet path to a URI
      const cssPath = panel.webview.asWebviewUri(onDiskPath);

      // These are the paths to the images for the welcome page
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

      // This is the path to the javascript file for the welcome page
      const jsPath = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, "media", "welcome.js"))
      );

      // This gets the kernel version so we can display it on the welcome page
      const newKernel = await fetchKernelVersionNonCLIDependent();
      // This gets the CLI version so we can display it on the welcome page
      const newCli = await getCurrentReleaseVersion(
        "https://api.github.com/repos/purduesigbots/pros-cli/releases/latest"
      );

      // Setup google analytics preference and welcome page display preference
      const useGoogleAnalytics =
        vscode.workspace
          .getConfiguration("pros")
          .get<boolean>("useGoogleAnalytics") ?? false;
      const showWelcomeOnStartup =
        vscode.workspace
          .getConfiguration("pros")
          .get<boolean>("showWelcomeOnStartup") ?? false;

      // Set the welcome page's html content
      panel.webview.html = getWebviewContent(
        // This function (in welcome-view.ts) injects all of the paths we just got into the welcome page html
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

      // This is the message handler for the welcome page
      panel.webview.onDidReceiveMessage(async (message) => {
        await vscode.workspace
          .getConfiguration("pros")
          .update(message.command, message.value, true);
      });
    } // End of callback function for welcome page
  ); // End of command registration for welcome page

  // TREE VIEW SETUP:

  // Register the tree view provider (calls TreeView constructor)

  vscode.window.registerTreeDataProvider(
    "prosTreeview",
    new TreeDataProvider() // This is the tree view provider (see tree-view.ts)
  );

  // Brain viewer stuff
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

  // If user settings say to run pros.install on startup, do so
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
}

/**
 * EXTENSION DEACTIVATION FUNCTION
 */
export function deactivate() {
  analytics.endSession();
}
