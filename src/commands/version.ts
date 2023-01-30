import * as vscode from "vscode";
import { BaseCommand } from "./base-command";

const runVersion = async () => {
  const versionCommand = new BaseCommand({
    command: "pros",
    args: ["--version"],
    message: "Getting Version",
    extraOutput: true,
    requiresProsProject: false,
  });

  await versionCommand.runCommand();
  let output = versionCommand.extraOutput;
  vscode.window.showInformationMessage(output!.toString());
};

export const version = async () => {
  try {
    
    await runVersion();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
