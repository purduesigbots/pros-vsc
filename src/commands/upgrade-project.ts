import * as vscode from "vscode";
import * as path from "path";

import { BaseCommand, BaseCommandOptions } from "./base-command";
import {
  getCurrentKernelOkapiVersion,
  getLatestKernelOkapiVersion,
} from "./command_tools";

const userApproval = async (
  kernel: string | undefined,
  okapi: string | undefined
) => {
  // Ask for user confirmation before upgrading kernal and/or okapi version
  let title;
  if (kernel && okapi) {
    title = `Upgrade to kernel ${kernel} and Okapilib ${okapi}? Warning: There may be breaking changes.`;
  } else if (okapi) {
    title = `Upgrade to Okapilib ${okapi}? Warning: There may be breaking changes.`;
  } else {
    title = `Upgrade to kernel ${kernel}? Warning: There may be breaking changes.`;
  }
  const output = await vscode.window.showQuickPick(
    [{ label: "yes", description: "recommended" }, { label: "no" }],
    {
      placeHolder: "yes",
      canPickMany: false,
      title: title,
    }
  );
  if (output === undefined || output.label === "no") {
    throw new Error();
  }
};


export const upgradeProject = async () => {
  //let {target, curKernel, curOkapi} = await getCurrentKernelOkapiVersion();
  //let {newKernel, newOkapi} = await getLatestKernelOkapiVersion(target);
  const upgradeProjectCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["c", "u", ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? [])],
    message: "Upgrading Project",
    requiresProsProject: true,
  };

  const upgradeProjectCommand: BaseCommand = new BaseCommand(
    upgradeProjectCommandOptions
  );

  try {
    const { target, curKernel, curOkapi } =
      await getCurrentKernelOkapiVersion();
    const { newKernel, newOkapi } = await getLatestKernelOkapiVersion(target);
    if (curKernel === newKernel && curOkapi === newOkapi) {
      await vscode.window.showInformationMessage("Project is up to date!");
      return;
    }

    await userApproval(
      newKernel === curKernel ? undefined : newKernel,
      newOkapi === curOkapi ? undefined : newOkapi
    );

    await upgradeProjectCommand.runCommand();

    await vscode.window.showInformationMessage("Project updated!");
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};

