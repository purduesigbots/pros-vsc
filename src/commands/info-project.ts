import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import { StringDecoder } from "string_decoder";
import { PREFIX } from "./cli-parsing";

export const infoProject = async () => {
  const infoProjectCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["c", "info-project", "--machine-output"],
    message: undefined,
    requiresProsProject: true,
    extraOutput: true,
    successMessage: "hidden",
  };

  const infoProjectCommand: BaseCommand = new BaseCommand(
    infoProjectCommandOptions
  );

  try {
    await infoProjectCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }

  var output = "Installed Templates: ";
  for (let e of infoProjectCommand.extraOutput!) {
    if (e.startsWith(PREFIX)) {
      let jdata = JSON.parse(e.substr(PREFIX.length));
      if (jdata.type === "finalize") {
        const target = jdata.data.project.target;
        for (let t of jdata.data.project.templates) {
          output += `${t.name}: ${t.version}, `;
        }
      }
    }
  }
  // Remove trailing comma
  output = output.slice(0, -2);
  vscode.window.showInformationMessage(output);
};
