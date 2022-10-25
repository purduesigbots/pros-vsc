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
        var command = `pros v5 run --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
        console.log(command);
        console.log(process.env["PATH"]);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            env: {
              ...process.env,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PATH: getChildProcessPath(),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PROS_TOOLCHAIN: getChildProcessProsToolchainPath(),
            },
          }
        );
        vscode.window.showInformationMessage("Project Ran!");
      } catch (error: any) {
        if (!error.stdout.includes("No v5 ports")) {
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
