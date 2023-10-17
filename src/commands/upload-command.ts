import { BaseCommand } from "./base-command";
import { ChildProcess } from "child_process";
import { PREFIX } from "./cli-parsing";
import { output } from "../extension";
import { window } from "vscode";

export class UploadCommand extends BaseCommand {
  lastProgress: number = 0;
  constructor() {
    super({
      command: "pros",
      args: ["upload", "--machine-output"],
      message: "Uploading Project",
      requiresProsProject: true,
      successMessage: "Project Uploaded Successfully",
    });
  }

  parseOutput = async (
    liveOutput: string[],
    process: ChildProcess
  ): Promise<boolean> => {
    const promptRegex: RegExp = /\[[\s\S]+\]/g;

    var errorMsg: string = "";
    var hasError = liveOutput.some((line) => {
      var prompt = promptRegex.exec(line);

      if (line.startsWith(PREFIX)) {
        let jdata = JSON.parse(line.substring(PREFIX.length));
        if (jdata.type.startsWith("log") && jdata.level !== "DEBUG") {
          output.appendLine(jdata.simpleMessage);
          if (jdata.level === "ERROR") {
            errorMsg = jdata.simpleMessage;
            return true;
          }
        } else if (jdata.type === "input/interactive" && jdata.can_confirm) {
          //handle confirm dialogs
          window
            .showWarningMessage(jdata.description, "Yes", "No")
            .then((response) => {
              if (response === "Yes") {
                process.stdin?.write(
                  `{"uuid": "${jdata.uuid}", "event": "confirm"}\n`
                );
              } else {
                process.kill();
              }
            });
        } else if (jdata.type === "notify/progress") {
          var progress: number = this.lastProgress;
          if (jdata.text.startsWith("Uploading")) {
            if (jdata.text.endsWith(".bin")) {
              progress = 90 + jdata.pct * 10;
            } else if (!jdata.text.endsWith(".ini")) {
              progress = jdata.pct * 90;
            }
          }
          this.progressWindow.increment(progress - this.lastProgress);
          this.lastProgress = progress;
        }
      } else if (line.startsWith("Multiple") && prompt) {
        let ports = prompt[0].replace(/[\[\]]/g, "").split(/\|/);
        // only time prompt is used is when there are mutltiple ports
        window.showWarningMessage(line, ...ports).then((response) => {
          if (response) {
            process.stdin?.write(response + "\n");
          } else {
            process.kill();
          }
        });
      }

      return false;
    });

    if (hasError) {
      throw errorMsg;
    }

    return true;
  };
}
