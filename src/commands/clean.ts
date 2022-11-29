import * as vscode from "vscode";
import { Base_Command } from "./base-command";

const runClean = async () => {
  const cleanCommand = new Base_Command({
    command: "pros",
    args: [
      "make",
      "clean",
      ...`${process.env.PROS_VSCODE_FLAGS}`.split(" ")
    ],
    message: "Cleaning Project",
    requires_pros_project: true
  });
  await cleanCommand.run_command();
};

/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */

export const clean = async () => {
  try {
    await runClean();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
