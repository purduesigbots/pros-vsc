import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

import {
  selectTeamNumber
} from "./command_tools";

export const setTeamNumber = async () => {
  let teamNumber = await selectTeamNumber("Enter a team number");
  const setTeamNumberCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["v5", "set_variable", "teamnumber", `${teamNumber}`],
    message: "Setting Team Number",
    requiresProsProject: false,
  };
  const setTeamNumberCommand: BaseCommand = new BaseCommand(setTeamNumberCommandOptions);
  try {
    await setTeamNumberCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};