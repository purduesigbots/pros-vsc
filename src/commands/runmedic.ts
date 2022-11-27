import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";

const medic_command_options: Base_Command_Options = {
  command: "vexcom",
  args: [
    "--medic"
  ],
  message: "Running Battery Medic on V5 Brain",
  requires_pros_project: false
}

const medic_command: Base_Command = new Base_Command(medic_command_options);

export const medic = async (context: vscode.ExtensionContext) => {
  try {
    // Set environmental variables
    // Run upload command
    await medic_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
