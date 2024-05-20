import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

export const resetConductor = async () => {
  const resetConductorCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["c", "reset"], //--force not needed: Ben's base-commands class auto-handles warning + confirmation.
    message: "Resetting Conductor",
    requiresProsProject: true,
    successMessage:
      "Conductor Reset Successfully. Any templates and/or depots previously cached will need to be re-fetched.",
  };
  const resetConductorCommand: BaseCommand = new BaseCommand(
    resetConductorCommandOptions
  );
  try {
    await resetConductorCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
