import { BaseCommand, BaseCommandOptions } from "./base-command";
import { window } from "vscode";
import { upload } from "./upload";

export const buildUpload = async () => {
  const buildCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["make"],
    message: "Building Project",
    requiresProsProject: true,
    successMessage: "hidden",
  };
  const buildCommand: BaseCommand = new BaseCommand(buildCommandOptions);
  try {
    await buildCommand.runCommand();
  } catch (err: any) {
    await window.showErrorMessage(err.message);
    return;
  }
  await upload();
};
