import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

const medicCommandOptions: BaseCommandOptions = {
  command: "vexcom",
  args: ["--medic"],
  message: "Running Battery Medic on V5 Brain",
  requiresProsProject: false,
  successMessage: "hidden", // I don't think we need an explicit success message here, they'll see if it's running or not on the brain
};

const medicCommand: BaseCommand = new BaseCommand(medicCommandOptions);

export const medic = async (context: vscode.ExtensionContext) => {
  try {
    // Set environmental variables
    // Run upload command
    await medicCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
