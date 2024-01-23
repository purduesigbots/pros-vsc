import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

export const build = async () => {
  const buildCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["make"],
    message: "Building Project",
    requiresProsProject: true,
    successMessage: "Project Built Successfully",
  };
  const buildCommand: BaseCommand = new BaseCommand(buildCommandOptions);
  try {
    await buildCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
