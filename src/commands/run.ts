import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

export const run = async () => {
  const runCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "v5",
      "run",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Running Project",
    requiresProsProject: true,
  };

  const runCommand: BaseCommand = new BaseCommand(runCommandOptions);

  try {
    await runCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};

/**
 * Call the PROS run CLI command.
 *
 * @param slot The slot number to place the executable in
 */
