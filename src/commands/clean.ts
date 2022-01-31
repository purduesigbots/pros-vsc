import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */

const runClean = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Cleaning Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        // Command to run to clean project
        var command = `pros make clean --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["VSCODE FLAGS"]}`
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command, { timeout: 30000 }
        );
        vscode.window.showInformationMessage("Project Cleaned!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const clean = async () => {
  try {
    await runClean();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
