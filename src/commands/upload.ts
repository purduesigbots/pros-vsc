import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
import {TOOLCHAIN, CLI_EXEC_PATH, PATH_SEP} from "../install"
import * as path from 'path';
/**
 * Call the PROS upload CLI command.
 *
 * @param slot The slot number to place the executable in
 */
 const setVariables = async() => { 
  if(!(TOOLCHAIN == "LOCAL")) {
    process.env.PROS_TOOLCHAIN = TOOLCHAIN;
  }
  console.log(CLI_EXEC_PATH);
  console.log(process.env.PROS_TOOLCHAIN);
  process.env.PATH += PATH_SEP+CLI_EXEC_PATH;
}

const runUpload = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Uploading Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `"${path.join(CLI_EXEC_PATH,"pros")}" u --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output`
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command/*, {timeout : 15000}*/
        );

        vscode.window.showInformationMessage("Project Uploaded!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const upload = async () => {
  try {
    await setVariables();
    await runUpload();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
