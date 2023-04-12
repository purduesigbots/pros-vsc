import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import * as path from "path";
import { getOperatingSystem } from "../one-click/install";

//run vision command
const visionCommandOptions: BaseCommandOptions = {
  command: "",
  args: [""],
  message: "Running Vision Utility",
  requiresProsProject: false,
};

//check if vision is installed and run it
export const runVision = async (context: vscode.ExtensionContext) => {
  const installPath = context.globalStorageUri.fsPath;
  const os = getOperatingSystem();

  if (os === "linux") {
    vscode.window.showErrorMessage("Vision Utility is not supported on Linux");
    return;
  }

  if(os === "windows") {
    visionCommandOptions.command = path.join(
      installPath,
      "install",
      `pros-vision-${os}`,
      `Vision Utility.exe`
    );

  } else {
    vscode.window.showInformationMessage("Vision Utility is currently not supported on MacOS. We are currently working on fixing this.");
    return;
    visionCommandOptions.command = "open";
    visionCommandOptions.args = [
      "-a",
      `"${
        path.join(
          installPath,
          "install",
          `pros-vision-${os}`,
          "osx64",
          `Vision Utility.app`
        )
      }"`
    ];
  }
  
  console.log(visionCommandOptions.command);

  const visionCommand: BaseCommand = new BaseCommand(visionCommandOptions);
  try {
    visionCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(
      "There is an error running Vision Utlity, check if it is installed"
    );
  }
};
