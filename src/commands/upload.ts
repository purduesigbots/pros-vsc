import * as vscode from "vscode";
import { Base_Command } from "./base-command";

const upload_command: Base_Command = new Base_Command(
  {
    "command": "pros",
    "args":
    [
      "upload"
    ],
    "requires_pros_project": true
  }
);

export const upload = async () => {
  try {
    await upload_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
