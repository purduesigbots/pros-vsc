import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import { StringDecoder } from "string_decoder";

export const infoProject = async () => {
  const runCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["c", "info-project"],
    message: "Getting Project Info...",
    requiresProsProject: true,
    successMessage: "hidden", // I don't think we need an explicit success message here, they'll see if it's running or not on the brain
  };

  const runCommand: BaseCommand = new BaseCommand(runCommandOptions);

  try {
    await runCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};

