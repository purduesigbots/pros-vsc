import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";

/**
 * Call the PROS upload CLI command.
 *
 * @param slot The slot number to place the executable in
 */
const runUpload = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Uploading Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        const { stdout, stderr } = await promisify(child_process.exec)(
          `pros u --project ${vscode.workspace.workspaceFolders?.[0].uri.path} --machine-output`
        );

        await vscode.window.showInformationMessage("Project Uploaded!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const upload = async () => {
  try {
    await runUpload();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
