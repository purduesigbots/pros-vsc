import * as vscode from "vscode";
import * as path from "path";

import { Base_Command, Base_Command_Options } from "./base-command";
import { selectDirectory , selectFileName} from "./command_tools";

export const capture = async () => {
  let dir = await selectDirectory("Select a directory where the screenshot will be saved");
  let file = await selectFileName("Enter file name for the screenshot");

  const capture_command_options: Base_Command_Options = {
    command: "prosv5",
    args: [
      "capture",
      `${path.join(dir, file)}`,
      "--build-cache",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Capturing Screenshot",
    requires_pros_project: true 
  }

const capture_command: Base_Command = new Base_Command(capture_command_options);

/*const selectDirectory = async () => {
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
};*/

try {
  await capture_command.run_command();
  await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.join(dir, file)));
} catch (err: any) {
  await vscode.window.showErrorMessage(err.message);
}
};
