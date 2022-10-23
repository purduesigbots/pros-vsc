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
  var test_string: (JSON|string)[] = ['Uc&42BWAaQ{"type": "log/message", "level": "INFO", "message": "INFO - pros.cli.common:callback - Debugging messages enabled", "simpleMessage": "Debugging messages enabled"}',
  'Uc&42BWAaQ{"text": "Not sending analytics for this command.\n\n", "type": "notify/echo", "notify_value": 0}',
  'Uc&42BWAaQ{"type": "log/message", "level": "DEBUG", "message": "DEBUG - pros:callback - CLI Version: 3.3.3", "simpleMessage": "CLI Version: 3.3.3"}',
  'Usage: pros make [OPTIONS] [BUILD_ARGS]...',
  '\n',
  'Error: C:\Users\btdav is not inside a PROS project. Execute this command from within a PROS project or specify it with --project project/path'];
  testcmd.parse_output(test_string);
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
