import * as vscode from "vscode";
import { gt } from "semver";

import { PREFIX } from "./cli-parsing";
import { BaseCommand, BaseCommandOptions } from "./base-command";

export const selectDirectory = async (prompt: string) => {
  const directoryOptions: vscode.OpenDialogOptions = {
    canSelectMany: false,
    title: prompt ?? "Select a directory",
    openLabel: "Select Folder",
    canSelectFolders: true,
    canSelectFiles: false,
  };
  const uri: string | undefined = await vscode.window
    .showOpenDialog(directoryOptions)
    .then((uri) => {
      return uri ? uri[0].fsPath : undefined;
    });

  return uri;
};

export const selectFileName = async (prompt: string) => {
  let inputName: string | undefined;
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: prompt ?? "Input File Name",
    placeHolder: "my-project",
    ignoreFocusOut: true
  };
  inputName = await vscode.window.showInputBox(projectNameOptions);
  return (inputName ? inputName : projectNameOptions.placeHolder) as string;
};

export const selectTeamNumber = async (prompt: string) => {
  let inputName: string | undefined;
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: prompt ?? "Input Team Number",
    placeHolder: "12345A",
    ignoreFocusOut: true
  };
  inputName = await vscode.window.showInputBox(projectNameOptions);
  return (inputName ? inputName : projectNameOptions.placeHolder) as string;
};

export const selectRobotName = async (prompt: string) => {
  let inputName: string | undefined;
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: prompt ?? "Input Robot Name",
    placeHolder: "My Robot",
    ignoreFocusOut: true
  };
  inputName = await vscode.window.showInputBox(projectNameOptions);
  return (inputName ? inputName : projectNameOptions.placeHolder) as string;
};

export const selectTarget = async () => {
  const targetOptions: vscode.QuickPickOptions = {
    placeHolder: "v5",
    title: "Select the target device",
    ignoreFocusOut: true
  };
  const target = await vscode.window.showQuickPick(
    ["v5", "cortex"],
    targetOptions
  );

  return target;
};

export const getCurrentKernelOkapiVersion = async () => {
  const kernelOkapiVersionCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "c",
      "info-project",
      "--machine-output",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Fetching Project Info",
    requiresProsProject: true,
    extraOutput: true,
  };

  const kernelOkapiVersionCommand: BaseCommand = new BaseCommand(
    kernelOkapiVersionCommandOptions
  );
  await kernelOkapiVersionCommand.runCommand();

  for (let e of kernelOkapiVersionCommand.extraOutput!) {
    if (e.startsWith(PREFIX)) {
      let jdata = JSON.parse(e.substr(PREFIX.length));
      if (jdata.type === "finalize") {
        const target = jdata.data.project.target;
        const curKernel = jdata.data.project.templates.find(
          (t: any) => t.name === "kernel"
        ).version;
        const curOkapi = jdata.data.project.templates.find(
          (t: any) => t.name === "okapilib"
        ).version;
        return { target, curKernel, curOkapi };
      }
    }
  }
  return { target: "", curKernel: "", curOkapi: "" };
};

export const getLatestKernelOkapiVersion = async (target: string) => {
  const latestKernelOkapiVersionCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "c",
      "q",
      "--target",
      target,
      "--machine-output",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Getting latest kernel and okapi versions",
    requiresProsProject: true,
    extraOutput: true,
  };

  const latestKernelOkapiVersionCommand: BaseCommand = new BaseCommand(
    latestKernelOkapiVersionCommandOptions
  );
  await latestKernelOkapiVersionCommand.runCommand();

  let newKernel = "0.0.0";
  let newOkapi = "0.0.0";

  for (let e of latestKernelOkapiVersionCommand.extraOutput!) {
    if (e.startsWith(PREFIX)) {
      let jdata = JSON.parse(e.substr(PREFIX.length));
      if (jdata.type === "finalize") {
        for (let ver of jdata.data) {
          if (ver.name === "kernel" && gt(ver.version, newKernel)) {
            newKernel = ver.version;
          } else if (ver.name === "okapilib" && gt(ver.version, newOkapi)) {
            newOkapi = ver.version;
          }
        }
      }
    }
  }

  return { newKernel, newOkapi };
};

export const selectKernelVersion = async (target: string) => {
  // Command to run to fetch all kernel versions
  const kernelVersionCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "c",
      "ls-templates",
      "--target",
      target,
      "--machine-output",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Fetching kernel versions",
    requiresProsProject: false,
    extraOutput: true,
  };

  const kernelVersionCommand: BaseCommand = new BaseCommand(
    kernelVersionCommandOptions
  );
  await kernelVersionCommand.runCommand();

  let versions: vscode.QuickPickItem[] = [
    { label: "latest", description: "Recommended" },
  ];
  // List all kernel versions as dropdown for users to select desired version.
  for (let e of kernelVersionCommand.extraOutput!) {
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
