import * as vscode from "vscode";
import { Base_Command } from "./base-command";

const medic_command: Base_Command = new Base_Command(
  {
    "command": "vexcom",
    "args":
    [
      "--medic"
    ],
    "requires_pros_project": false
  }
)
export const medic = async (context: vscode.ExtensionContext) => {
  try {
    // Set environmental variables
    // Run upload command
    await medic_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
