import * as vscode from "vscode";
import { Base_Command } from "./base-command";

const build_command: Base_Command = new Base_Command(
  {
    "command": "pros",
    "args":
    [
      "build-compile-commands"
    ],
    "requires_pros_project": true
  }
);

export const build = async () => {
  try {
    await build_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};