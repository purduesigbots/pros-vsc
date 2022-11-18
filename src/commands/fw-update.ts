import * as vscode from "vscode";
import { Base_Command } from "./base-command";

const fw_update_command: Base_Command = new Base_Command(
  {
    "command": "vexcom",
    "args": [
      "--vexos",
      "latest"
    ],
    "requires_pros_project": false
  }
);

export const updateFirmware = async () => {
  try {
    await fw_update_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
