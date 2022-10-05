
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


    }

    validate_pros_project = async(): Promise<boolean> => {
        // this function will check if the current directory is a pros project

        // the easiest way to check this is by checking if a file called `project.pros` exists in the current working directory.
        // if it does, then we are in a pros project, and we can return true
        // a method of doing this can be seen on line 393 of src/extensions.ts. However, this method is not 100% reliable.
        // This method assumes the 0th index of the workspaceFolders array is the current working directory, which may not always be the case according to documentation.
        // Doing this could lead to problems if the user has multiple projects open at once.

        // One thing you should look at doing is identifying the current working directory, and then checking if the file exists in that directory.
        // A potential workaround for this is to do the following:
        // identify a bash command that will return the current working directory
        // use the child_process.exec() function to run that command
        // parse the output of the command to get the current working directory
        // check if the file exists in that directory

        // if the file does not exist, then we can return false

        return true;
    }

    run_command = async () => {
        // This function is a doozy, so I'll try to break it down as best as I can.

        // The first thing we want to do is check if the command requires a pros project.

        // If it does, we want to check if the current working directory is a pros project.
        //      If it is, we can continue on with the command.
        //      If it is not, we want to throw an error, and tell the user that they need to be in a pros project to run this command.

        // If the command does not require a pros project, we can continue on with the command.

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


        // The spawn function returns a child process object.
        // This object has a few useful properties, but the one we are interested in is the `stdout` property.
        // This property is a stream that we can listen to for output from the command.

        // We can listen to the stream by using the `on` function.
        // The `on` function takes in 2 arguments:
        //      1. The event to listen for
        //      2. The function to call when the event is triggered

        // The event we want to listen for is the `data` event.
        // when that event is triggered, we want to call a function that will parse the output from the command (the parse_output function right below here).

    }

    parse_output = async (live_output: Buffer[]): Promise<boolean> => {

        // This function will parse the output of the command we ran.
        // Normally, we use the --machine-output flag to get the output in a json format.
        // This makes it easier to parse the output, as everything is categorized into different levels, such as Warning or error.
        // However, some things that are errors or cause the command to fail are not categorized as such.

        // For example, if the user tries to run `pros make` without a project.pros file, the command will fail, but the output will not be categorized as an error.

        // In this case, we want to check if the output contains the string "error" or "Error". Or something along those lines

        // If it does, we want to throw an error, and tell the user that the command failed.

        // If it does not, we want to return true.

        return true;
    }

}