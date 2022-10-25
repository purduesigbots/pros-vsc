import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
import { getChildProcessPath } from "../one-click/path";

const runMedic = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running Brain Medic",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        // Command to run to upload project to brain
        var command = `vexcom --medic`;
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            encoding: "utf8",
            maxBuffer: 1024 * 1024 * 50,
            env: {
              ...process.env,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PATH: getChildProcessPath(),
            },
          }
        );

        vscode.window.showInformationMessage("Battery Medic Started!");
      } catch (error: any) {
        // Parse and display error message if one occured
        throw new Error(parseErrorMessage(error.stdout));
      }
    }
  );
};

export const medic = async (context: vscode.ExtensionContext) => {
  try {
    // Set environmental variables
    // Run upload command
    await runMedic();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
