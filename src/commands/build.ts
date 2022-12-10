import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

const buildCommandOptions: BaseCommandOptions = {
  command: "pros",
  args: ["make"],
  message: "Building Project",
  requiresProsProject: true,
};
const buildCommand: BaseCommand = new BaseCommand(buildCommandOptions);

export const build = async () => {
  try {
    await buildCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
