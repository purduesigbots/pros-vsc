import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

import { PREFIX } from "./cli-parsing";

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
    // error msg
    throw new Error();
  }
  return uri;
};

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

const selectKernelVersion = async (target: string) => {
  const { stdout, stderr } = await promisify(child_process.exec)(
    `pros c ls-templates --target ${target} --machine-output`
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

const createProject = async (
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
      return new Promise<void>(async (resolve, reject) => {
        try {
          const { stdout, stderr } = await promisify(child_process.exec)(
            `pros c n ${projectPath} ${target} ${version} --machine-output`,
            { encoding: "utf8", maxBuffer: 1024 * 1024 * 5 }
          );

          if (stderr) {
            reject(new Error(stderr));
          }

          vscode.window.showInformationMessage("Project created!");
          resolve();
        } catch (error) {
          console.error(error.stdout);
          for (let e of error.stdout.split(/\r?\n/)) {
            if (!e.startsWith(PREFIX)) {
              continue;
            }

            let jdata = JSON.parse(e.substr(PREFIX.length));
            let [primary] = jdata.type.split("/");
            if (primary === "log" && jdata.level === "ERROR") {
              reject(new Error(jdata.simpleMessage));
            }
          }
        }
      });
    }
  );

  return projectPath;
};

export const createNewProject = async () => {
  let uri: string, target: string, projectName: string, version: string;
  try {
    uri = await selectDirectory();
    target = await selectTarget();
    projectName = await selectProjectName();
    version = await selectKernelVersion(target);
  } catch (err) {
    // don't do anything here, this just means that the user exited
    return;
  }

  try {
    const projectPath = await createProject(uri, projectName, target, version);
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(projectPath)
    );
  } catch (err) {
    // here
    await vscode.window.showErrorMessage(err.message);
  }
};
