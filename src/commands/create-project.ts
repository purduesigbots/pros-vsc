import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as pros from "@purduesigbots/pros-cli-middleware";

import { parseErrorMessage, PREFIX, ansi_regex} from "./cli-parsing";
import { TOOLCHAIN, CLI_EXEC_PATH, PATH_SEP } from "../one-click/install";
import { FinalizeOutput, FinalizeTemplateQuery, handleFinalize, handleLog, handleNotify, handlePrompt, NotifyOutput } from "../util/middleware-linkage";
import { NotificationMetadata } from "../util/progress-notification";
import { output } from "../extension";
/**
 * Query the user for the directory where the project will be created.
 *
 * @returns The path to the directory where the new project will go.
 */
const selectDirectory = async () => {
  const directoryOptions: vscode.OpenDialogOptions = {
    canSelectMany: false,
    title: "Select a directory where the PROS Project will be created",
    openLabel: "Create Project Here",
    canSelectFolders: true,
    canSelectFiles: false,
  };
  const uri: string | undefined = await vscode.window
    .showOpenDialog(directoryOptions)
    .then((uri) => {
      return uri ? uri[0].fsPath : undefined;
    });
  if (uri === undefined) {
    throw new Error();
  }
  return uri;
};

/**
 * Query the user for the target device for the project.
 *
 * @returns The selected target name
 */
const selectTarget = async () => {
  const targetOptions: vscode.QuickPickOptions = {
    placeHolder: "v5",
    title: "Select the target device",
  };
  const target = await vscode.window.showQuickPick(
    ["v5", "cortex"],
    targetOptions
  );
  if (target === undefined) {
    throw new Error();
  }
  return target;
};

/**
 * Query the user for a name for the new project.
 *
 * @returns The project's name
 */
const selectProjectName = async () => {
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: "Project Name",
    placeHolder: "my-pros-project",
  };
  let projectName = await vscode.window.showInputBox(projectNameOptions);
  if (!projectName) {
    projectName = "my-pros-project";
  }
  return projectName;
};

/**
 * Query the user for the PROS kernel version to use.
 *
 * @param target The project's target device
 * @returns A version string or "latest"
 */
const selectKernelVersion = async (target: string) => {
  const versions: vscode.QuickPickItem[] = [
    { label: "latest", description: "Recommended" },
  ];

  const notifications: Array<NotificationMetadata> = [];

  await pros.listTemplates({
    notify: handleNotify(notifications),
    finalize: ({d: finalData}: {d: FinalizeOutput<FinalizeTemplateQuery>}) =>
      versions.push(...finalData.data.map(v => ({ label: v.version }))),
    log: handleLog(false),
    prompt: handlePrompt,
    input: () => {}
  }, 'kernel', { target });

  const kernelOptions: vscode.QuickPickOptions = {
    placeHolder: "latest",
    title: "Select the project version",
  };

  const version = await vscode.window.showQuickPick(versions, kernelOptions);

  if (version === undefined) {
    throw new Error();
  }

  return version.label;
};

/**
 * Calls the project creation CLI function.
 *
 * @param uri The path where the project directory will be created
 * @param projectName The name of the new project
 * @param target The target device for the new project
 * @param version The kernel version for the new project
 * @returns The path to the newly created project
 */
const runCreateProject = async (
  uri: string,
  projectName: string,
  target: string,
  version: string
) => {
  // create the project directory
  const projectPath = path.join(uri, projectName);
  await fs.promises.mkdir(projectPath, { recursive: true });

  try {
    const notifications: Array<NotificationMetadata> = [];

    let shouldShowEchoOutputInNotification = true;

    // create new project
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Creating Project",
        cancellable: false,
      },
      async (progress, token) => {


    await pros.createNewProject({
      notify: handleNotify(notifications, (notificationTracker: NotificationMetadata, data: NotifyOutput) => {
        // creating a project triggers a build immediately after creation and
        // the build output gets sent to us via notify/echo messages, which
        // the default behavior of ProgressNotification won't handle very well
        // (rapidly replacing the text field of a notification with build output).
        // so instead we override the behavior; looking for the line that
        // signifies the start of the build, and switching output to the output
        // channel at that point. phew!
        if (shouldShowEchoOutputInNotification) {
          notificationTracker.notification.notify(data.simpleMessage);
          if (data.text.includes('Building')) {
            output.show(true);
            output.appendLine(data.text.replace(ansi_regex, ""));
            shouldShowEchoOutputInNotification = false;
          }
        } else {
          // TODO: strip ANSI color codes
          output.appendLine(data.text.replace(ansi_regex, ""));
        }
      }),
      finalize: handleFinalize,
      log: handleLog(false),
      prompt: handlePrompt,
      // input callback shouldn't fire at this point because
      // we've already handled everything that should need it
      input: () => {},
    }, projectPath, version, target);

  });

    vscode.window.showInformationMessage("Project created!");
  } catch (error: any) {
    // TODO: figure out proper behavior here
    // throw new Error(parseErrorMessage(error.stdout));
    throw error;
  }

  return projectPath;
};

export const createNewProject = async () => {
  let uri: string, target: string, projectName: string, version: string;
  try {
    uri = await selectDirectory();
    target = await selectTarget();
    projectName = await selectProjectName();
    version = await selectKernelVersion(target);
  } catch (error: any) {
    // don't do anything here, this just means that the user exited
    return;
  }

  try {
    const projectPath = await runCreateProject(
      uri,
      projectName,
      target,
      version
    );

    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(projectPath)
    );
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
