import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { getChildProcessPath } from "../one-click/path";

const runFirmwareUpdate = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Updating Firmware",
      cancellable: false,
    },
    async (_progress, _token) => {
      try {
        var command = "vexcom --vexos latest";
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
        console.log(stdout);
        console.error(stderr);

        vscode.window.showInformationMessage("Firmware updated!");
      } catch (error: any) {
        console.log(error.stderr);
        throw new Error(error.stderr);
      }
    }
  );
};

export const updateFirmware = async () => {
  try {
    await runFirmwareUpdate();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
