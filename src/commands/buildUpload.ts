import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseMakeOutput } from "./cli-parsing";
import { output } from "../extension";
import { getChildProcessPath } from "../one-click/path";
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
        // Command to run to build and upload project
        var command = `pros mu --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            env: {
              ...process.env,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PATH: getChildProcessPath(),
            },
            maxBuffer: 1024 * 1024 * 50,
          }
        );
        await vscode.window.showInformationMessage("Project Built!");
      } catch (error: any) {
        if (!error.stdout.includes("No v5 ports")) {
          const rtn = await vscode.window.showErrorMessage(
            parseMakeOutput(error.stdout),
            "View Output!",
            "No Thanks!"
          );
          if (rtn === "View Output!") {
            output.show();
          }
        } else {
          vscode.window.showErrorMessage(parseMakeOutput(error.stdout));
        }
      }
    }
  );
};

export const buildUpload = async () => {
  try {
    await runBuildUpload();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
