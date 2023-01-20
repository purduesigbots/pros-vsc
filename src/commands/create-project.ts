import * as vscode from "vscode";
import * as path from "path";

import { BaseCommand, BaseCommandOptions } from "./base-command";
import {
  selectDirectory,
  selectFileName,
  selectTarget,
  selectKernelVersion,
} from "./command_tools";

export const createNewProject = async () => {
  let dir = await selectDirectory(
    "Select a directory to create the project in"
  );
  let name = await selectFileName("Enter a name for the project");

  let target = await selectTarget();
  let kernel = await selectKernelVersion(target);
  const createProjectCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "c",
      "new",
      `${path.join(dir, name)}`,
      `${target}`,
      `${kernel}`,
      "--build-cache",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Creating Project",
    requiresProsProject: false,
  };

  const createProjectCommand: BaseCommand = new BaseCommand(
    createProjectCommandOptions
  );

  try {
    await createProjectCommand.runCommand();
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(path.join(dir, name))
    );
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
