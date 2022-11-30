import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";

export const stop = async () => {
  const stop_command_options: Base_Command_Options = {
    command: "pros",
    args: [
      "v5",
      "stop",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Stopping Project",
    requires_pros_project: true
  }

const stop_command: Base_Command = new Base_Command(stop_command_options);

try {
  await stop_command.run_command();
} catch (err: any) {
  await vscode.window.showErrorMessage(err.message);
}
};
/**
 * Call the PROS stop CLI command.
 *
 * @param slot The slot number to place the executable in
 */

/*const runStop = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Stopping Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `pros v5 stop --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
        console.log(command);
        console.log(process.env["PATH"]);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            env: {
              ...process.env,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PATH: getChildProcessPath(),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              PROS_TOOLCHAIN: getChildProcessProsToolchainPath(),
            },
          }
        );
        vscode.window.showInformationMessage("Project Stopped!");
      } catch (error: any) {
        if (!error.stdout.includes("No v5 ports")) {
          const rtn = await vscode.window.showErrorMessage(
            parseMakeOutput(error.stdout),
            "View Output!",
            "No Thanks!"
          );
          if (rtn === "View Output!") {
            output.show();
          }
        } else {
          vscode.window.showErrorMessage(parseMakeOutput(error.stdout));
        }
      }
    }
  );
};

export const stop = async () => {
  try {
    await runStop();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};*/
