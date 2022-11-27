import * as vscode from "vscode";
import * as path from "path";

import { Base_Command, Base_Command_Options } from "./base-command";
import { selectDirectory, selectFileName, selectTarget, selectKernelVersion } from "./command_tools";


export const createNewProject = async () => {
  let dir = await selectDirectory("Select a directory to create the project in");
  let name = await selectFileName("Enter a name for the project");

  let target = await selectTarget();
  let kernel = await selectKernelVersion(target);
  const create_project_command_options: Base_Command_Options = {
    command: "pros",
    args: [
      "c",
      "new",
      `${path.join(dir, name)}`,
      `${target}`,
      `${kernel}`,
      "--build-cache",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Creating Project",
    requires_pros_project: false 
  }

  const create_project_command: Base_Command = new Base_Command(create_project_command_options);

  try {
    await create_project_command.run_command();
    await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.join(dir, name)));
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
