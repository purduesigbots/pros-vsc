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
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */
 import { Base_Command } from "./base-command";
 const testcmd: Base_Command = new Base_Command();

const runBuild = async () => {
  console.log("Building")
  var test_string: string = "ERROR: object yuam not found";
  var test_2 = "uploading 23438588 bytes";
  var test_3 = "########################";
  var test_4 = "Do you want to continue: y/n";
  var test_buf: Buffer = Buffer.from(test_string);
  var buf_arr: Buffer[] = [test_buf,test_buf];
  testcmd.parse_output(buf_arr);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Building Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        // Command to run to build project
        var command = `pros make --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
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
        vscode.window.showInformationMessage("Project Quilt Ready!");
      } catch (error: any) {
        console.log(error.stdout);
        const rtn = await vscode.window.showErrorMessage(
          parseMakeOutput(error.stdout),
          "View Output!",
          "No Thanks!"
        );
        if (rtn === "View Output!") {
          output.show();
        }
      }
    }
  );
};

export const build = async () => {
  try {
    await runBuild();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
