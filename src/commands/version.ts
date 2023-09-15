import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

const versionCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["--version"],
    message: "Getting PROS CLI Version",
    requiresProsProject: true,
    extraOutput: true,
};

const versionCommand: BaseCommand = new BaseCommand(versionCommandOptions);

export const version = async () => {
    try {
        await versionCommand.runCommand();
        var msg = versionCommand.extraOutput![0].toString(); //! = forced abort if undefined (guaranteeing it'll be string and allowing collapse if it isn't)
        msg = msg.replace("pros, version", "");
        await vscode.window.showInformationMessage("PROS CLI Version: " + msg);
    } catch (err: any) {
        await vscode.window.showErrorMessage(err.message);
    }
};