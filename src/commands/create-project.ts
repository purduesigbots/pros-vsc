import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

import { parseErrorMessage, PREFIX } from "./cli-parsing";
import { TOOLCHAIN, CLI_EXEC_PATH, PATH_SEP } from "../install"
/**
 * Query the user for the directory where the project will be created.
 *
 * @returns The path to the directory where the new project will go.
 */
const setVariables = async () => {
  if (!(TOOLCHAIN == "LOCAL")) {
    process.env.PROS_TOOLCHAIN = TOOLCHAIN;
  }
  console.log(CLI_EXEC_PATH);
  console.log(process.env.PROS_TOOLCHAIN);
  process.env.PATH += PATH_SEP + CLI_EXEC_PATH;
  process.env.LC_ALL = "en_US.utf-8";
}
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
  var command = `"${path.join(CLI_EXEC_PATH, "pros")}" c ls-templates --target ${target} --machine-output`
  console.log(command);
  const { stdout, stderr } = await promisify(child_process.exec)(
    command/*, {timeout : 15000}*/
  );
  let versions: vscode.QuickPickItem[] = [
    { label: "latest", description: "Recommended" },
  ];
  for (let e of stdout.split(/\r?\n/)) {
    if (e.startsWith(PREFIX)) {
      let jdata = JSON.parse(e.substr(PREFIX.length));
      if (jdata.type === "finalize") {
        for (let ver of jdata.data) {
          if (ver.name === "kernel") {
            versions.push({ label: ver.version });
          }
        }
      }
    }
  }

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

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading libraries",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `"${path.join(CLI_EXEC_PATH, "pros")}" c n "${projectPath}" ${target} ${version} --machine-output`
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command/*, {timeout : 15000}*/
        );
        console.log(stdout);
        if (stderr) {
          throw new Error(stderr);
        }

        vscode.window.showInformationMessage("Project created!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );

  return projectPath;
};

export const createNewProject = async () => {
  let uri: string, target: string, projectName: string, version: string;
  try {
    await setVariables();
    uri = await selectDirectory();
    target = await selectTarget();
    projectName = await selectProjectName();
    version = await selectKernelVersion(target);
  } catch (err) {
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
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
