import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";

/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */
const runBuildUpload = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Building and Uploading Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        const { stdout, stderr } = await promisify(child_process.exec)(
          `pros mu --project ${vscode.workspace.workspaceFolders?.[0].uri.fsPath} --machine-output`
        );

        await vscode.window.showInformationMessage("Project Built!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const buildUpload = async () => {
  try {
    await runBuildUpload();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
