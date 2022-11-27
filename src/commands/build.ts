import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";

const build_command_options: Base_Command_Options = {
  command: "pros",
  args: [
    "build-compile-commands"
  ],
  message: "Building Project",
  requires_pros_project: true
}
const build_command: Base_Command = new Base_Command(build_command_options);

export const build = async () => {
  try {
    await build_command.run_command();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};