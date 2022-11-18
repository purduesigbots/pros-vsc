import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";
import { getChildProcessPath } from "../one-click/path";

export const selectDirectory = async () => {
  const directoryOptions: vscode.OpenDialogOptions = {
    canSelectMany: false,
    title: "Select a directory where the screenshot will be saved",
    openLabel: "Select file",
    canSelectFolders: true,
    canSelectFiles: true,
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

export const selectFileName = async () => {
  let inputName: string | undefined;
  const projectNameOptions: vscode.InputBoxOptions = {
    prompt: "File Name",
    placeHolder: "my-project",
  };
  inputName = await vscode.window.showInputBox(projectNameOptions);
  return (inputName ? inputName : projectNameOptions.placeHolder) as string;
};

const runFile = async (output: string) => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Selecting file",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `pros v5 ${output} --force ${process.env["PROS_VSCODE_FLAGS"]} --machine-output`;
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
        vscode.window.showInformationMessage("File selected!");
      } catch (error: any) {
        throw new Error(error);
      }
    }
  );
};

export const commandFile = async () => {
  let uri: string, fileName: string, output: string;
  try {
    uri = await selectDirectory();
    fileName = await selectFileName();
  } catch (error) {
    vscode.window.showErrorMessage("Error selecting file");
    return;
  }
  output = path.join(uri, fileName);
  try {
    await runFile(output);
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(output)
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
};