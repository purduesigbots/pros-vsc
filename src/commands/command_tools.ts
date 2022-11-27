import * as vscode from "vscode";

import { PREFIX } from "./cli-parsing";
import { Base_Command, Base_Command_Options } from "./base-command";

export const selectDirectory = async (prompt: string) => {
  const directoryOptions: vscode.OpenDialogOptions = {
    canSelectMany: false,
    title: prompt ?? "Select a directory",
    openLabel: "Select file",
    canSelectFolders: true,
    canSelectFiles: true,
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

export const selectFileName = async (prompt: string) => {
  let inputName: string | undefined;
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: prompt ?? "Input File Name",
    placeHolder: "my-project",
  };
  inputName = await vscode.window.showInputBox(projectNameOptions);
  return (inputName ? inputName : projectNameOptions.placeHolder) as string;
};

export const selectTarget = async () => {
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

export const selectKernelVersion = async (target: string) => {
  // Command to run to fetch all kernel versions
  const kernel_version_command_options: Base_Command_Options = {
    command: "prosv5",
    args: [
      "c",
      "ls-templates",
      "--target",
      target,
      "--machine-output",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Fetching kernel versions",
    requires_pros_project: false,
    extra_output: true
  };

  const kernel_version_command: Base_Command = new Base_Command(kernel_version_command_options);
  await kernel_version_command.run_command();

  let versions: vscode.QuickPickItem[] = [
    { label: "latest", description: "Recommended" }
  ];
  // List all kernel versions as dropdown for users to select desired version.
  for (let e of kernel_version_command.extra_output!) {
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
    title: "Select Project Version",
  };
  const version = await vscode.window.showQuickPick(versions, kernelOptions);
  if (version === undefined) {
    throw new Error();
  }
  return version.label;
};
