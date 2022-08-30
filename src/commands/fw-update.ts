import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
import { getChildProcessPath } from "../one-click/path";

export const updateFirmware = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Updating Firmware",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `vexcom --help`; // TODO: set this to something real
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            encoding: "utf8",
            maxBuffer: 1024 * 1024 * 50,
            env: {
              ...process.env,
              PATH: getChildProcessPath(),
            },
          }
        );

        vscode.window.showInformationMessage("Project Uploaded!");
      } catch (error: any) {
        // Parse and display error message if one occured
        await vscode.window.showErrorMessage(parseErrorMessage(error.stdout));
      }
    }
  );
};
