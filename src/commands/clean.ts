import * as vscode from "vscode";
import { BaseCommand } from "./base-command";

const runClean = async () => {
  const cleanCommand = new BaseCommand({
    command: "pros",
    args: ["make", "clean"],
    message: "Cleaning Project",
    requiresProsProject: true,
    successMessage: "Project Cleaned Successfully",
  });
  await cleanCommand.runCommand();
};

export const clean = async () => {
  try {
    await runClean();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
