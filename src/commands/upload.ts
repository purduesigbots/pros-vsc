import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";


const upload_command_options: Base_Command_Options = {
  command: "pros",
  args: [
    "upload"
  ],
  message: "Uploading Project",
  requires_pros_project: true
}
const upload_command: Base_Command = new Base_Command(upload_command_options);

export const upload = async () => {
  try {
    await upload_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
