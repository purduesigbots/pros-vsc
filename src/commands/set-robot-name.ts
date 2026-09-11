import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

import { selectRobotName } from "./command_tools";

export const setRobotName = async () => {
  let robotName = await selectRobotName("Enter a Robot Name");
  const setRobotNameCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["v5", "set_variable", "robotname", `${robotName}`],
    message: "Setting Robot Name",
    requiresProsProject: false,
    successMessage: "Robot Name Set Successfully",
  };
  const setRobotNameCommand: BaseCommand = new BaseCommand(
    setRobotNameCommandOptions
  );
  try {
    await setRobotNameCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
