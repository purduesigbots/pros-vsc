import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";


export const run = async () => {
  const run_command_options: Base_Command_Options = {
    command: "pros",
    args: [
      "v5",
      "run",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Running Project",
    requires_pros_project: true
  }

const run_command: Base_Command = new Base_Command(run_command_options);

try {
  await run_command.run_command();
} catch (err: any) {
  await vscode.window.showErrorMessage(err.message);
}
};


/**
 * Call the PROS run CLI command.
 *
 * @param slot The slot number to place the executable in
 */
