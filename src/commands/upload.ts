import * as vscode from "vscode";
import { BaseCommand } from "./base-command";
import { UploadCommand } from "./upload-command";

export const upload = async () => {
  try {
    const uploadCommand: BaseCommand = new UploadCommand();
    await uploadCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
