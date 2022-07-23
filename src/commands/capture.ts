import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
import { getChildProcessPath } from "../one-click/path";

const selectDirectory = async () => {
  const directoryOptions: vscode.OpenDialogOptions = {
    canSelectMany: false,
    title: "Select a directory where the screenshot will be saved",
    openLabel: "Save Screenshot Here",
    canSelectFolders: true,
    canSelectFiles: false,
  };
  const uri: string | undefined = await vscode.window
    .showOpenDialog(directoryOptions)
    .then((uri) => {
      return uri ? uri[0].fsPath : undefined;
    });
  if (uri === undefined) {
    throw new Error();
  }
  return uri;
};

const selectFileName = async () => {
  let inputName: string | undefined;
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: "File Name",
    placeHolder: "my-screenshot",
  };
  inputName = await vscode.window.showInputBox(projectNameOptions);
  return (inputName ? inputName : projectNameOptions.placeHolder) as string;
};

const runCapture = async (output: string) => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Capturing image",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        // Command to run to clean project
        var command = `pros v5 capture ${output} --force ${process.env["PROS_VSCODE_FLAGS"]} --machine-output`;
        console.log(command);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            timeout: 6000,
            maxBuffer: 1024 * 1024 * 10,
            env: {
              ...process.env,
              PATH: getChildProcessPath(),
            },
          }
        );
        let result = parseErrorMessage(stdout);
        if (!(result === "NOERROR")) {
          throw new Error(result);
        }
        vscode.window.showInformationMessage("Capture saved!");
      } catch (error: any) {
        throw new Error(error);
      }
    }
  );
};

export const capture = async () => {
  let uri: string, fileName: string, output: string;
  try {
    uri = await selectDirectory();
    fileName = await selectFileName();
  } catch (error) {
    vscode.window.showErrorMessage("Error selecting output location");
    return;
  }
  output = path.join(uri, fileName);
  if (!output.endsWith(".png")) {
    output += ".png";
  }
  try {
    await runCapture(output);
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(output)
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
};
