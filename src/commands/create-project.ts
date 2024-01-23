import * as vscode from "vscode";
import * as path from "path";

import { BaseCommand, BaseCommandOptions } from "./base-command";
import {
  selectDirectory,
  selectFileName,
  selectTarget,
  selectKernelVersion,
} from "./command_tools";

import { betaFeaturesEnabled } from "../extension";

export const createNewProject = async () => {
  let dir = await selectDirectory(
    "Select a directory to create the project in"
  );
  if (dir === undefined) {
    vscode.window.showErrorMessage(
      "No directory selected when creating project"
    );
    return;
  }

  let name = await selectFileName("Enter a name for the project");
  if (name === undefined) {
    vscode.window.showErrorMessage("No name selected when creating project");
    return;
  }

  let target = await selectTarget();
  if (target === undefined) {
    vscode.window.showErrorMessage("No target selected when creating project");
    return;
  }

  let kernel = await selectKernelVersion(target);
  if (kernel === undefined) {
    vscode.window.showErrorMessage("No kernel selected when creating project");
    return;
  }

  const createProjectCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "c",
      "new",
      `${path.join(dir, name)}`,
      `${target}`,
      `${kernel}`,
      "--build-cache",
    ],
    optionalArgs: [betaFeaturesEnabled ? "--beta" : undefined],
    message: "Creating Project",
    requiresProsProject: false,
    successMessage: "Project Created Successfully",
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
