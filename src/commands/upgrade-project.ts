import * as vscode from "vscode";
import * as path from "path";

import { Base_Command, Base_Command_Options } from "./base-command";
import { getCurrentKernelOkapiVersion, getLatestKernelOkapiVersion } from "./command_tools";

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
  await vscode.window.showQuickPick(
    [{ label: "yes", description: "recommended" }, { label: "no" }],
    {
      placeHolder: "yes",
      canPickMany: false,
      title: title,
    }
  );
};

export const upgradeProject = async () => {
  //let {target, curKernel, curOkapi} = await getCurrentKernelOkapiVersion();
  //let {newKernel, newOkapi} = await getLatestKernelOkapiVersion(target);
  const upgrade_project_command_options: Base_Command_Options = {
    command: "pros",
    args: [
      "c",
      "u",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Upgrading Project",
    requires_pros_project: true 
  }

  const upgrade_project_command: Base_Command = new Base_Command(upgrade_project_command_options);

  try {
    const { target, curKernel, curOkapi } = await getCurrentKernelOkapiVersion();
    const { newKernel, newOkapi } = await getLatestKernelOkapiVersion(target);
    if (curKernel === newKernel && curOkapi === newOkapi) {
      await vscode.window.showInformationMessage("Project is up to date!");
      return;
    }

    await userApproval(
      newKernel === curKernel ? undefined : newKernel,
      newOkapi === curOkapi ? undefined : newOkapi
    );

    await upgrade_project_command.run_command();

    await vscode.window.showInformationMessage("Project updated!");
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }

};