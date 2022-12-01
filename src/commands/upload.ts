import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

const uploadCommandOptions: BaseCommandOptions = {
  command: "pros",
  args: ["upload"],
  message: "Uploading Project",
  requiresProsProject: true,
};
const uploadCommand: BaseCommand = new BaseCommand(uploadCommandOptions);

export const upload = async () => {
  try {
    await uploadCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
