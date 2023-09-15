import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

const fwUpdateCommandOptions: BaseCommandOptions = {
  command: "vexcom",
  args: ["--vexos", "latest"],
  message: "Updating VEXos",
  requiresProsProject: false,
  successMessage: "VEXos Updated Successfully",
};
const fwUpdateCommand: BaseCommand = new BaseCommand(fwUpdateCommandOptions);

export const updateFirmware = async () => {
  try {
    await fwUpdateCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
