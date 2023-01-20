import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

export const stop = async () => {
  const stopCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "v5",
      "stop",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Stopping Project",
    requiresProsProject: true,
  };

  const stopCommand: BaseCommand = new BaseCommand(stopCommandOptions);

  try {
    await stopCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
/**
 * Call the PROS stop CLI command.
 *
 * @param slot The slot number to place the executable in
 */
