import * as vscode from "vscode";
import { BaseCommand } from "./base-command";
/**
 * Call the PROS build CLI command.
 *
 * @param slot The slot number to place the executable in
 */

const runBuildUpload = async () => {
  const buildUploadCommand = new BaseCommand({
    command: "pros",
    args: ["mu", ...`${process.env.PROS_VSCODE_FLAGS}`.split(" ")],
    message: "Building and Uploading Project",
    requiresProsProject: true,
  });
  await buildUploadCommand.runCommand();
};

export const buildUpload = async () => {
  try {
    await runBuildUpload();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
