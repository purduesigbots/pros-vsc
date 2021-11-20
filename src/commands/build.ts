import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";

/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */
const runBuild = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Building Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        const { stdout, stderr } = await promisify(child_process.exec)(
          `pros build-compile-commands --project ${vscode.workspace.workspaceFolders?.[0].uri.fsPath} --machine-output`
        );

        vscode.window.showInformationMessage("Project Built!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const build = async () => {
  try {
    await runBuild();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
