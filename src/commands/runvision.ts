import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import * as path from "path";
import { getOperatingSystem } from "../one-click/install";

//run vision command    
const visionCommandOptions: BaseCommandOptions = {
    command: "",
    args: ["--vision"],
    message: "Running Vision Sensor on V5 Brain",
    requiresProsProject: false,
};

//check if vision is installed and run it
export const runVision =  async (context: vscode.ExtensionContext) => {
    if(getOperatingSystem() === "linux") {
        vscode.window.showErrorMessage("Vision Sensor is not supported on Linux");
        return;
    }
    const visionCommand: BaseCommand = new BaseCommand(visionCommandOptions);
    const installPath = context.globalStorageUri.fsPath; 
    visionCommandOptions.command = path.join(installPath, "install", `pros-vision-${getOperatingSystem()}`, getOperatingSystem() === "windows" ? "win32" : "osx64", "Vision Utility");
    try {
        await visionCommand.runCommand();
        await vscode.window.showInformationMessage("Vision Sensor is running on V5 Brain");
    } catch (err: any) {
        await vscode.window.showErrorMessage("There is an error running Vision Utlity, check if it is installed");

    }
};  