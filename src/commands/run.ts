import * as vscode from "vscode";
import { Base_Command, Base_Command_Options } from "./base-command";


export const run = async () => {
  const run_command_options: Base_Command_Options = {
    command: "prosv5",
    args: [
      "run",
      ...(process.env["PROS_VSCODE_FLAGS"]?.split(" ") ?? []),
    ],
    message: "Running Project",
    requires_pros_project: true
  }

const run_command: Base_Command = new Base_Command(run_command_options);

try {
  await run_command.run_command();
} catch (err: any) {
  await vscode.window.showErrorMessage(err.message);
}
};


/**
 * Call the PROS run CLI command.
 *
 * @param slot The slot number to place the executable in
 */

/*const runRun = async () => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running Project",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        var command = `pros v5 run --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
        console.log(command);
        console.log(process.env["PATH"]);
        const { stdout, stderr } = await promisify(child_process.exec)(
          command,
          {
            env: {
              ...process.env,
              PATH: getChildProcessPath(),
              PROS_TOOLCHAIN: getChildProcessProsToolchainPath(),
            },
          }
        );
        vscode.window.showInformationMessage("Project Ran!");
      } catch (error: any) {
        if (!error.stdout.includes("No v5 ports")) {
        }
      }
    }
  );
};

export const run = async () => {
  try {
    await runRun();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};*/
