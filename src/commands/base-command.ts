import * as child_process from "child_process";
import * as vscode from "vscode";
import { BackgroundProgress } from "../logger";
import { getChildProcessPath, getChildProcessProsToolchainPath } from "../one-click/path";
import { get_cwd_is_pros } from "../workspace";
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
export class Base_Command {
    command: string;
    args: string[];
    cwd: string;
    requires_pros_project: boolean;

    constructor(command_data_json: any) {
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

        this.command = command_data_json.command;
        this.args = command_data_json.args;
        this.cwd = process.cwd();
        this.requires_pros_project = command_data_json.requires_pros_project;

        // As far as implementing this onto each command, there are two ways you can do this.
        // The first way is to do it how I layed it out above, where in each command file we make a json object and then pass it into the constructor.
        // The second method is to change the above to become an abstract class, and then make a new class for each command which inherits from this class.
        // There may be other ways to do this, but these are the two I can think of right now.
        // I'm personally leaning towards the first method, as there isn't much if anything that would be different between each command.
        // However, it's completely up to you which one you want to do, just make sure it works and is easy to understand.
        
    }

    validate_pros_project = async(): Promise<boolean> => {
        const [projectDir, isProsProject] = await get_cwd_is_pros();
        if (isProsProject) {
            this.cwd = projectDir.fsPath;
        }
        return isProsProject;
    }

    run_command = async () => {
        // This function is a doozy, so I'll try to break it down as best as I can.

        // The first thing we want to do is check if the command requires a pros project.

        // If it does, we want to check if the current working directory is a pros project.
        //      If it is, we can continue on with the command.
        //      If it is not, we want to throw an error, and tell the user that they need to be in a pros project to run this command.

        // If the command does not require a pros project, we can continue on with the command.
        console.log("--------\n\n\n\n\-----------\n\n\n\n");
        if (this.requires_pros_project) {
            let in_pros_project = await this.validate_pros_project();
            if (!in_pros_project) {
                vscode.window.showInformationMessage("This command can only be run in a PROS project!");
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

        const progressWindow = new BackgroundProgress("Running " + JSON.stringify(this), true, true);

        const child = child_process.spawn(
            this.command,
            this.args,
            {
                cwd: this.cwd,
                env: {
                    ...process.env,
                    PATH: getChildProcessPath(),
                    PROS_TOOLCHAIN: getChildProcessProsToolchainPath()
                }
            }
        );

        // The spawn function returns a child process object.
        // This object has a few useful properties, but the one we are interested in is the `stdout` property.
        // This property is a stream that we can listen to for output from the command.

        // We can listen to the stream by using the `on` function.
        // The `on` function takes in 2 arguments:
        //      1. The event to listen for
        //      2. The function to call when the event is triggered

        // The event we want to listen for is the `data` event.
        // when that event is triggered, we want to call a function that will parse the output from the command (the parse_output function right below here).

        child.stdout.on('data', (data) => {
            try{
                this.parse_output(data.toString().split("\n"));
            } catch (e) {
                vscode.window.showInformationMessage((e as Error).message);
            }
        });
        child.stderr.on('data', (data) => {
            try {
                this.parse_output(data.toString().split("\n"));
            } catch (e) {
                vscode.window.showInformationMessage((e as Error).message);
            }
        });

        progressWindow.token?.onCancellationRequested(() => {
            child.kill();
        });

        child.on('exit', () => {
            progressWindow.stop();
        });
    }
    
    parse_output = async (live_output: (string)[] ): Promise<boolean> => {
        const parse_regex: RegExp = RegExp('((Error: )|(ERROR: ))(.+)');
        // This function will parse the output of the command we ran.
        // Normally, we use the --machine-output flag to get the output in a json format.
        // This makes it easier to parse the output, as everything is categorized into different levels, such as Warning or error.
        // However, some things that are errors or cause the command to fail are not categorized as such.

        // For example, if the user tries to run `pros make` without a project.pros file, the command will fail, but the output will not be categorized as an error.

        // In this case, we want to check if the output contains the string "error" or "Error". Or something along those lines

        // If it does, we want to throw an error, and tell the user that the command failed.
        var output_as_string: string = live_output.toString();
        /*
        console.log(live_output.length);
        // If it does not, we want to return true.
        for(let i = 0;i < live_output.length; i++){
            output_as_string = live_output[i];
            var error_msg = parse_regex.exec(output_as_string);
            var test: boolean = false;
            if(error_msg){
                test = true;
            }
            console.log(test);
            if (test == true){
                throw new Error('\n\n PROS Error occurred. Aborting command.\n'+error_msg!+"line no: "+(i+1)+'\n');
            }
            // console.log(live_output[i]);
            // if(typeof live_output[i] === 'object'){
            //     output_as_string += JSON.stringify(live_output[i]);
            // }
            // else{
            //     output_as_string += live_output[i];
            // }
        }
        */
        
        // console.log("Parsing Output");
       
        // console.log(output_as_string);
        // var error_msg = parse_regex.exec(output_as_string);
        // var test: boolean = false;
        // if(error_msg){
        //     test = true;
        // }
        // console.log(test);
        // if (test == true){
        //     throw new Error('\n\n PROS Error occurred. Aborting command.\n'+error_msg!+'\n');
        // }

        return true;
    }

}
