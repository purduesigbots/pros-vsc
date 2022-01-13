import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
import { TOOLCHAIN, CLI_EXEC_PATH, PATH_SEP } from "../one-click/install"
import * as path from 'path';
/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */
 const setVariables = async () => {
  // Set PROS_TOOLCHAIN if one-click installed
  if (!(TOOLCHAIN == "LOCAL")) {
    process.env.PROS_TOOLCHAIN = TOOLCHAIN;
  }
  // Set pros executable path
  process.env.PATH += PATH_SEP + CLI_EXEC_PATH;
  // Set language variable
  process.env.LC_ALL = "en_US.utf-8";
}

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
        var command = `"${path.join(CLI_EXEC_PATH, "pros")}" make clean --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output`
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
    await setVariables();
    await runClean();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
