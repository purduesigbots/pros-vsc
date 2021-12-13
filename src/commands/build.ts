import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import { parseErrorMessage } from "./cli-parsing";
import {TOOLCHAIN, CLI_EXEC_PATH} from "../install"

/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */
const runBuild = async () => {
  if(!(TOOLCHAIN == "LOCAL")) {
    process.env.PROS_TOOLCHAIN = TOOLCHAIN;
  }

  console.log(CLI_EXEC_PATH);
  console.log(process.env.PROS_TOOLCHAIN);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Building Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        const { stdout, stderr } = await promisify(child_process.exec)(
          CLI_EXEC_PATH + ` build-compile-commands --project ${vscode.workspace.workspaceFolders?.[0].uri.fsPath} --machine-output`
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
