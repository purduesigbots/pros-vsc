import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";

const fw_update_command_options: Base_Command_Options = {
  command: "vexcom",
  args: [
    "--vexos",
    "latest"
  ],
  message: "Updating VEXos",
  requires_pros_project: false
}
const fw_update_command: Base_Command = new Base_Command(fw_update_command_options);

export const updateFirmware = async () => {
  try {
    await fw_update_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
