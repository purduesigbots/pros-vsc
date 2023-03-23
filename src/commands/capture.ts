import * as vscode from "vscode";
import * as path from "path";

import { BaseCommand, BaseCommandOptions } from "./base-command";
import { selectDirectory, selectFileName } from "./command_tools";

export const capture = async () => {
  let dir = await selectDirectory(
    "Select a directory where the screenshot will be saved"
  );
  if (dir === undefined) {
    vscode.window.showErrorMessage(
      "No directory selected when capturing screenshot"
    );
    return;
  }

  let file = await selectFileName("Enter file name for the screenshot");
  if (file === undefined) {
    vscode.window.showErrorMessage(
      "No file name selected when capturing screenshot"
    );
    return;
  }

  const captureCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: [
      "v5",
      "capture",
      `${path.join(dir, file)}`,
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Capturing Screenshot",
    requiresProsProject: true,
  };

  const captureCommand: BaseCommand = new BaseCommand(captureCommandOptions);

  try {
    await captureCommand.runCommand();
    await vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(path.join(dir, file.replace(".png", "") + ".png"))
    );
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
