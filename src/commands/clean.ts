import * as vscode from "vscode";
import { BaseCommand } from "./base-command";

const runClean = async () => {
  const cleanCommand = new BaseCommand({
    command: "pros",
    args: ["make", "clean", ...`${process.env.PROS_VSCODE_FLAGS}`.split(" ")],
    message: "Cleaning Project",
    requiresProsProject: true,
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
