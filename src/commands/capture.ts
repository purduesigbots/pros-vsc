import * as vscode from "vscode";
import * as path from "path";

import { Base_Command, Base_Command_Options } from "./base-command";
import { selectDirectory , selectFileName} from "./command_tools";

export const capture = async () => {
  let dir = await selectDirectory("Select a directory where the screenshot will be saved");
  let file = await selectFileName("Enter file name for the screenshot");

  const capture_command_options: Base_Command_Options = {
    command: "pros",
    args: [
      "v5",
      "capture",
      `${path.join(dir, file)}`,
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Capturing Screenshot",
    requires_pros_project: true 
  }


  const capture_command: Base_Command = new Base_Command(capture_command_options);


  try {
    await capture_command.run_command();
    await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(path.join(dir, file.replace(".png","")+ ".png")));
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
