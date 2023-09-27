import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import { StringDecoder } from "string_decoder";

export const run = async () => {
  const slot = await findSlotFromProjectPros();
  const runCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["v5", "run", slot.toString()],
    message: "Running Project",
    requiresProsProject: true,
    successMessage: "hidden", // I don't think we need an explicit success message here, they'll see if it's running or not on the brain
  };

  const runCommand: BaseCommand = new BaseCommand(runCommandOptions);

  try {
    await runCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};

const findSlotFromProjectPros = async (): Promise<Number> => {
  const filenameSearch = "project.pros";
  let prosProjects = await vscode.workspace.findFiles(filenameSearch);

  if (prosProjects.length === 1) {
    const decoder = new StringDecoder();
    const buffer = Buffer.from(
      await vscode.workspace.fs.readFile(prosProjects[0])
    );
    const text = decoder.write(buffer);
    const json = JSON.parse(text);
    if (json["py/state"]["upload_options"]?.slot) {
      return json["py/state"]["upload_options"]["slot"];
    }
  }
  return 1;
};

/**
 * Call the PROS run CLI command.
 *
 * @param slot The slot number to place the executable in
 */
