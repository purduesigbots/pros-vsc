import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import { parseErrorMessage } from "./cli-parsing";
import {TOOLCHAIN, CLI_EXEC_PATH, PATH_SEP} from "../install"
import * as path from 'path';
/**
 * Call the PROS build CLI command.
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

const runBuild = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Building Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `"${path.join(CLI_EXEC_PATH,"pros")}" build-compile-commands --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}"`
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command, {timeout : 60000}
        );
        console.log(stdout);
        vscode.window.showInformationMessage("Project Built!");
      } catch (error) {
        vscode.window.showErrorMessage("Build Failed!");
        console.log(error.stdout);
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const build = async () => {
  try {
    await setVariables();
    await runBuild();
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
