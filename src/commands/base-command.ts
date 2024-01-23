import * as child_process from "child_process";
import * as vscode from "vscode";
import { output } from "../extension";
import { BackgroundProgress } from "../logger";
import {
  getChildProcessPath,
  getChildProcessProsToolchainPath,
} from "../one-click/path";
import { getProjectFileDir } from "../workspace_utils";
/*

    I realize I missed something quite important in the presentation. It's the idea of synchronous v.s. asynchronous functions.

    In short, a synchronous function is one that blocks the execution of the program until it completes.
    An asynchronous function is one that does not block the execution of the program until it completes.

    The way this works is that when either function is called, it waits until something is returned to it.
    However, in the case of an asynchronous function, it will return a promise.
    This promise is a placeholder for the value that will be returned later.

    This is how javascript enables having multiple things happen at once, since by design, javascript is single-threaded.

    However, we might not always want to have multiple tasks happening at the same time.
    This is where the await keyword comes in.

    The await keyword will wait for the promise to be resolved before continuing the execution of the program.

    In this project, almost every function you should write will be asynchronous.

*/
export type BaseCommandOptions = {
  command: string;
  args: string[];
  message: string | undefined;
  requiresProsProject: boolean;
  extraOutput?: boolean;
  successMessage?: string;
  optionalArgs?: (string | undefined)[];
};
export class BaseCommand {
  command: string;
  args: string[];
  message: string | undefined;
  successMessage: string | undefined;
  cwd: string;
  requiresProsProject: boolean;
  exited: boolean = false;
  extraOutput?: string[];
  progressWindow: BackgroundProgress;

  constructor(options: BaseCommandOptions) {
    // the constructor is what is called whenever a new instance of the class is created
    // eg. const my_command : Base_Command = new Base_Command();

    // since different commands require different arguments, it would be nice to pass them in here
    // as a json object, and then parse out the arguments we need
    // an example of this would be passing in the following json object:
    // {
    //     "command": "pros v5 capture",
    //     "args": {
    //         "name": "directory",
    //         "value": function_to_get_directory(),
    //         "command_line": "--directory"
    //     },
    //     "options": {
    //         "name": "env",
    //         "value": function_to_get_environment_variables()
    //     }
    //     "requires_pros_project": true
    // }
    // Ideally, we would be able to parse out what command we are running, and then parse out the arguments
    // we can store the full command to run in a string for later user.
    // we can also distinguish commands that must be called from a pros project or not.
    // eg. `pros make` must be called from within a PROS project, but `pros v5 capture` can be called from anywhere

    this.command = options.command;
    this.args = options.args;
    // for each element in optionalArgs, if the element is not undefined, add it to args
    for (let arg of options.optionalArgs ?? []) {
      if (arg !== undefined) {
        this.args.push(arg);
      }
    }
    if (this.command === "pros" && process.env.PROS_VSCODE_FLAGS) {
      this.args.push(...`${process.env.PROS_VSCODE_FLAGS}`.split(" "));
    }
    this.message = options.message;
    this.cwd = process.cwd();
    this.requiresProsProject = options.requiresProsProject;
    this.extraOutput = options.extraOutput ? [] : undefined;
    this.successMessage = options.successMessage;

    this.progressWindow = new BackgroundProgress(this.message, true, false);
    // As far as implementing this onto each command, there are two ways you can do this.
    // The first way is to do it how I layed it out above, where in each command file we make a json object and then pass it into the constructor.
    // The second method is to change the above to become an abstract class, and then make a new class for each command which inherits from this class.
    // There may be other ways to do this, but these are the two I can think of right now.
    // I'm personally leaning towards the first method, as there isn't much if anything that would be different between each command.
    // However, it's completely up to you which one you want to do, just make sure it works and is easy to understand.
  }

  validateProsProject = async (): Promise<boolean> => {
    const projectDir = await getProjectFileDir();
    if (projectDir) {
      this.cwd = projectDir.fsPath;
    }
    return projectDir !== null;
  };

  runCommand = async () => {
    // This function is a doozy, so I'll try to break it down as best as I can.

    // The first thing we want to do is check if the command requires a pros project.

    // If it does, we want to check if the current working directory is a pros project.
    //      If it is, we can continue on with the command.
    //      If it is not, we want to throw an error, and tell the user that they need to be in a pros project to run this command.

    // If the command does not require a pros project, we can continue on with the command.
    if (this.requiresProsProject) {
      let inProsProject = await this.validateProsProject();
      if (!inProsProject) {
        vscode.window.showInformationMessage(
          "This command can only be run in a PROS project!"
        );
        return;
      }
    }

    // Next, we want to check if the command has any arguments.

    // If it does, we want to check if the user has provided any arguments.
    //      If they have, we can continue on with the command.
    //      If they have not, we want to throw an error, and tell the user that they need to provide arguments to run this command.

    // If the command does not have any arguments, we can continue on with the command.

    // Next, we want to attempt to run the command.
    // we will do this by using the `child_process` module. Specifically the `spawn` function.

    // The spawn function takes in 3 arguments:
    //      1. The command to run
    //      2. An array of arguments to pass to the command
    //      3. An object of options to pass to the command

    // The command to run is the command we stored in the constructor.
    // The arguments to pass to the command are the arguments we stored in the constructor.
    // The options to pass to the command are the options we stored in the constructor.

    this.progressWindow.start();

    console.log("Running command: " + this.command);
    console.log("Args: " + this.args);
    const child = child_process.spawn(this.command, this.args, {
      cwd: this.cwd,
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        PATH: getChildProcessPath(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        PROS_TOOLCHAIN: getChildProcessProsToolchainPath(),
      },
    });
    this.exited = false;
    output.clear();

    // The spawn function returns a child process object.
    // This object has a few useful properties, but the one we are interested in is the `stdout` property.
    // This property is a stream that we can listen to for output from the command.

    // We can listen to the stream by using the `on` function.
    // The `on` function takes in 2 arguments:
    //      1. The event to listen for
    //      2. The function to call when the event is triggered

    // The event we want to listen for is the `data` event.
    // when that event is triggered, we want to call a function that will parse the output from the command (the parse_output function right below here).
    let hasError: boolean = false;
    let choiceExit: boolean = false;
    child.stdout.on("data", (data) => {
      this.parseOutput(data.toString().split(/\r?\n/), child).catch((e) => {
        hasError = true;
        vscode.window.showErrorMessage(e, "View Output").then((response) => {
          if (response) {
            output.show();
          }
        });
      });
    });
    child.stderr.on("data", (data) => {
      this.parseOutput(data.toString().split(/\r?\n/), child).catch((e) => {
        hasError = true;
        vscode.window.showErrorMessage(e, "View Output").then((response) => {
          if (response) {
            output.show();
          }
        });
      });
    });

    this.progressWindow.token?.onCancellationRequested(() => {
      choiceExit = true;
      child.kill();
    });

    child.on("exit", () => {
      this.progressWindow.stop();
      this.exited = true;
      console.log("Exited");
    });

    await this.waitForExit();

    if (this.successMessage === "hidden") {
      return;
    }

    if (!hasError && !choiceExit) {
      vscode.window.showInformationMessage(
        this.successMessage || "Command completed successfully!"
      );
    } else if (choiceExit) {
      vscode.window.showInformationMessage("Command cancelled!");
    }
  };

  parseOutput = async (
    liveOutput: string[],
    process: child_process.ChildProcess
  ): Promise<boolean> => {
    const errorRegex: RegExp = /((Error: )|(ERROR )|(ERROR: )|(: error:))(.+)/;
    const yesNoRegex: RegExp = /\[y\/N\]/;
    const promptRegex: RegExp = /\[[\s\S]+\]/;
    // This function will parse the output of the command we ran.
    // Normally, we use the --machine-output flag to get the output in a json format.
    // This makes it easier to parse the output, as everything is categorized into different levels, such as Warning or error.
    // However, some things that are errors or cause the command to fail are not categorized as such.

    // For example, if the user tries to run `pros make` without a project.pros file, the command will fail, but the output will not be categorized as an error.

    // In this case, we want to check if the output contains the string "error" or "Error". Or something along those lines

    // If it does, we want to throw an error, and tell the user that the command failed.
    var errorMsg: string = "";
    var hasError = liveOutput.some((line: string) => {
      if (line.trim().length > 0) {
        if (this.extraOutput) {
          this.extraOutput.push(line);
        }
        output.appendLine(line);
      }
      var error = errorRegex.exec(line);
      var yesNo = yesNoRegex.exec(line);
      var prompt = promptRegex.exec(line);
      if (error) {
        errorMsg = line;
        if (errorMsg.length > 103) {
          errorMsg = errorMsg.substring(0, 100) + "...";
        }
        return true;
      } else if (yesNo) {
        // handle confirm dialogs
        vscode.window.showWarningMessage(line, "Yes", "No").then((response) => {
          if (response === "Yes") {
            process.stdin?.write("y\n");
          } else {
            process.stdin?.write("N\n");
          }
        });
      } else if (line.startsWith("Multiple") && prompt) {
        // only time prompt is used is when there are mutltiple ports
        vscode.window
          .showWarningMessage(
            line,
            ...prompt[0].replace(/[\[\]]/g, "").split(/\|/)
          )
          .then((response) => {
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

  waitForExit = async () => {
    while (!this.exited) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return true;
  };
}
