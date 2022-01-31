import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import { parseMakeOutput } from "./cli-parsing";
import { output } from "../extension";
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
        // Command to run to build project
        var command = `pros make --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["VSCODE FLAGS"]}`
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command
        );
        vscode.window.showInformationMessage("Project Built!");
      } catch (error) {
        const rtn = await vscode.window.showErrorMessage(parseMakeOutput(error.stdout),"View Output!","No Thanks!");
        if (rtn==="View Output!") {
          output.show();
        }
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
