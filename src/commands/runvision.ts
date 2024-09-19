import * as vscode from "vscode";
import * as path from "path";
import { getOperatingSystem } from "../one-click/install";
import { exec } from "child_process";
import { BackgroundProgress } from "../logger";

//check if vision is installed and run it
export const runVision = async (context: vscode.ExtensionContext) => {
  const installPath = context.globalStorageUri.fsPath;
  const os = getOperatingSystem();
  var visionUtilityPath = "";

  if (os === "linux") {
    vscode.window.showErrorMessage("Vision Utility is not supported on Linux");
    return;
  }

  if (os === "windows") {
    visionUtilityPath = `"${path.join(
      installPath,
      "install",
      `pros-vision-${os}`,
      "win32",
      `Vision Utility.exe`
    )}"`;
  } else {
    visionUtilityPath = `"${path.join(
      installPath,
      "install",
      `pros-vision-${os}`,
      "osx64",
      `Vision Utility.app`,
      "Contents",
      "MacOS",
      "nwjs"
    )}"`;
  }

  console.log(visionUtilityPath);
  try {
    const progressWindow = new BackgroundProgress(
      "Starting Vision Utility",
      false,
      true
    );
    exec(visionUtilityPath);
    progressWindow.stop();
  } catch (err: any) {
    await vscode.window.showErrorMessage(
      "There is an error running Vision Utlity, check if it is installed"
    );
  }
};
