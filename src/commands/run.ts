import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import { parseMakeOutput } from "./cli-parsing";
import { output } from "../extension";
import {
  getChildProcessPath,
  getChildProcessProsToolchainPath,
} from "../one-click/path";
/**
 * Call the PROS run CLI command.
 *
 * @param slot The slot number to place the executable in
 */

const runRun = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `pros v5 run "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
        console.log(command);
        console.log(process.env["PATH"]);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            env: {
              ...process.env,
              PATH: getChildProcessPath(),
              PROS_TOOLCHAIN: getChildProcessProsToolchainPath(),
            },
          }
        );
        vscode.window.showInformationMessage("Project Ran!");
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

export const run = async () => {
  try {
    await runRun();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
