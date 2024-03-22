import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";
import { getOperatingSystem } from "./one-click/install";
import { getChildProcessProsToolchainPath } from "./one-click/path";
import { configurePaths } from "./one-click/install";

/**
 * This function searches a directory of the workspace for a file with the given name
 *
 * @param filename This is the name of the file to search for (including extension)
 * @param dir This is the directory to search in. Ex. "src" or "include" or "src/chassis". "root" causes the entire workspace to be searched.
 * @param debug This is a boolean that determines whether or not to log all potential matches + other debug messages
 * @returns The Uri of the first matching file if any are found, null if directory or file not found
 */
export const findFile = async (
  filename: string,
  dir: string,
  debug: boolean = false
): Promise<vscode.Uri | null> => {
  const debugMsg = "While searching for " + filename + " in " + dir + ": ";

  // Return null if either string or dir is undefined or null
  if (
    filename === undefined ||
    dir === undefined ||
    filename === null ||
    dir === null
  ) {
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "invalid input of some kind! ");
    }
    return null;
  }

  // Perform search operation
  if (dir === "root") {
    // Search entire workspace if dir is "root"
    var searchResults = await vscode.workspace.findFiles(filename);
  } else {
    // Search specified directory if dir is not "root". This is done by using glob patterns.
    // Ex. "**/src/**/main.cpp" searches for "main.cpp" in any folder named "src" in the workspace, including all folders inside of all folders labeled "src" in the workspace.
    // NOTE: The use of vscode's joinPath is not necesary here, since everything is a web uri so regardless of user OS, it will be a standard forward slash for filepaths.
    var searchResults = await vscode.workspace.findFiles(
      "**/" + dir + "/**/" + filename
    );
  }

  // vscode's findFiles function returns a thenable which operates as an array of URIs. Thus, we can use array functions on it:
  if (searchResults.length === 0) {
    // Return null if no files found
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "no matching files found!");
    }
    return null;
  } else if (debug) {
    // >= 1 matching file found, in debug mode
    searchResults.forEach((path) => {
      // Log all matching files found if in debug mode
      console.log(debugMsg + "matching file found: " + path);
    });
  }

  // Double check file exists (for some reason vscode's findFiles function returns files that don't exist for users of the web version of vscode sometimes)
  // (According to Benjamin Davis anyways)
  try {
    await vscode.workspace.fs.stat(searchResults[0]);
  } catch (err) {
    return null;
  }

  // Return first matching file found if any are found
  return searchResults[0];
};

/**
 * This function searches the workspace for all instances of a project.pros file. It then returns the folders containing those files.
 * It is used to offer the user a choice of which pros project to work on in the event there are multiple in the current workspace.
 *
 * @returns An array of every folder which houses a project.pros file in the workspace. Returns an empty array if none found.
 */
export async function findProsProjectFolders(debug: boolean = false) {
  // Type is any for js reasons. Doesn't really matter, will end up being a string array.
  const debugMsg = "While searching for pros project folder names: ";
  var array: any = [];
  if (
    vscode.workspace.workspaceFolders === undefined ||
    vscode.workspace.workspaceFolders === null
  ) {
    // Return empty array if no workspace folders
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "no workspace folders found!");
    }
    return array;
  }

  if (debug) {
    // Log list of found folders in workspace if in debug mode
    console.log(
      debugMsg +
        " candidate folders found: " +
        vscode.workspace.workspaceFolders
    );
  }

  for (const workspace of vscode.workspace.workspaceFolders) {
    // Loop through each workspace folder and check if it contains a project.pros file in any of its subfolders (or at root level)
    const currentDir = workspace.uri; // uri to top workspace folder
    const folders = await vscode.workspace.fs.readDirectory(currentDir); // all subfolders, subfiles of top workspace folder
    for (const folder of folders) {
      // Loop through each subfolder and check if it contains a project.pros file
      var exists = true; // assume it exists until proven otherwise

      try {
        // By using VSCode's stat function (and the uri parsing functions), this code should work regardless
        // of if the workspace is using a physical file system or not.
        const workspaceUri = vscode.Uri.file(
          path.join(currentDir.fsPath, folder[0])
        ); // uri to subfolder
        const uriString = `${workspaceUri.scheme}:${
          workspaceUri.path
        }/${"project.pros"}`; // uri path to project.pros file in subfolder (candidate)
        const uri = vscode.Uri.parse(uriString);

        // Check if candidate path actually leads to a project.pros file
        await vscode.workspace.fs.stat(uri);
      } catch (e) {
        // If not, set exists to false
        console.error(e);
        exists = false;
      }
      if (exists) {
        // We have confirmed that the candidate path leads to a project.pros file. Add this folder to the array.
        array.push(folder);
      }
    }
  }

  if (debug) {
    // Log list of found folders in workspace if in debug mode
    console.log(debugMsg + " final list of folders found: " + array);
  }

  return array; // return array of folders
}

/**
 * This function is a convinient wrapper for findFile. It searches the entire workspace for a project.pros file.
 *
 * @returns A boolean indicating whether or not the current workspace contains a pros project
 */
export const workspaceContainsProsProject = async (
  debug: boolean = false
): Promise<boolean> => {
  return (await findFile("project.pros", "root", debug)) !== null;
};

/**
 * This function is a convinient wrapper for findFile. It searches the entire workspace for a project.pros file.
 *
 * @returns A vscode.Uri pointing to the directory containing the project.pros file, or null if no project.pros file found
 */
export const getProjectFileDir = async (
  debug: boolean = false
): Promise<vscode.Uri | null> => {
  let fullUri = await findFile("project.pros", "root", debug); // get uri of project.pros file
  if (fullUri === null) {
    // return null if no project.pros file found
    return null;
  }
  return vscode.Uri.file(path.dirname(fullUri.fsPath)); // return uri of directory containing project.pros file
};

/**
 * This function creates or gets a reference to an existing vscode terminal named "PROS Terminal".
 * It also configures the path of the terminal to include the pros-cli.
 * It also cleans up any duplicate terminals named "PROS Terminal" that may exist.
 *
 * @param context The vscode extension context
 * @returns A reference to the PROS terminal
 */
export const getProsTerminal = async (
  context: vscode.ExtensionContext
): Promise<vscode.Terminal> => {
  // First, check if one or more terminals labeled "PROS Terminal" already exist.
  const prosTerminals = vscode.window.terminals.filter(
    (t) => t.name === "PROS Terminal"
  ); // Get all terminals named "PROS Terminal"

  if (prosTerminals.length > 1) {
    // Clean up duplicate terminals
    prosTerminals.slice(1).forEach((t) => t.dispose());
  }

  // If there is already a terminal named "PROS Terminal" and it has the correct path, return it.
  if (prosTerminals.length) {
    const options: Readonly<vscode.TerminalOptions> =
      prosTerminals[0].creationOptions;
    if (options?.env?.PATH?.includes("pros-cli")) {
      // Only keep the existing terminal if it has the correct path
      return prosTerminals[0];
    }
  }

  // If there is not already a terminal named "PROS Terminal" or it does not have the correct path, create a new one.
  await configurePaths(context); // Configure the paths (see install.ts) so that everything runs properly when you click a button

  // Create a new terminal with the correct path, return it.
  return vscode.window.createTerminal({
    name: "PROS Terminal",
    env: process.env,
  });
};

/**
 * This function allows the user to choose which pros project to work on in the event there are multiple in the current workspace.
 * It also warns the user if there is no pros project in the current workspace.
 *
 * @returns Nothing
 */
export async function chooseProject() {
  // First, check if the current workspace exists correctly
  if (
    vscode.workspace.workspaceFolders === undefined ||
    vscode.workspace.workspaceFolders === null
  ) {
    return; // return if no workspace folders
  }

  // Second, check if the current workspace contains a pros project
  var array = await findProsProjectFolders(); // get list of folders which contain pros projects
  // If no pros projects found, warn user and return
  if (array.length === 0) {
    vscode.window.showInformationMessage(
      "No PROS Projects found in current directory!"
    );
    return;
  }

  // Third, prompt user to choose which pros project to work on
  const targetOptions: vscode.QuickPickOptions = {
    placeHolder: array[0].name,
    title: "Select the PROS project to work on",
    ignoreFocusOut: true,
  };
  var folderNames: Array<vscode.QuickPickItem> = [];
  for (const f of array) {
    folderNames.push({ label: f[0], description: "" });
  }
  folderNames.push({
    label: "PROS: Cancel Selection",
    description: "Do not open a PROS project",
  });
  // Display the options to users
  const target = await vscode.window.showQuickPick(folderNames, targetOptions);
  if (target === undefined) {
    throw new Error();
  }
  if (target.label === "PROS: Cancel Selection") {
    return;
  }
  //This will open the folder the user selects
  await vscode.commands.executeCommand(
    "vscode.openFolder",
    vscode.Uri.file(
      path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, target.label)
    )
  );
}

/**
 * This function modifies the c_cpp_properties.json file which is used by the C/C++ extension to provide intellisense.
 * This allows it to "understand" pros.
 *
 * @param dirpath the path to the c_cpp_properties.json file
 * @param json json object
 * @param os user's OS (for pathing)
 */
const modifyCCppJson = async (
  dirpath: vscode.Uri,
  json: any,
  os: string,
  debug: boolean = false
) => {
  // First, check if json configurations setting contains include section, if not, add it
  let include = path.join(dirpath.fsPath, "include");
  if (!json.configurations[0].includePath.includes(include)) {
    json.configurations[0].includePath.push(include);
  }

  // Third, setup cStandard, cppStandard, and intelliSenseMode
  json.configurations[0].cStandard = "gnu11";
  json.configurations[0].cppStandard = "gnu++20";
  json.configurations[0].intelliSenseMode = "gcc-arm";

  // Fourth, account for mac users with different framework filepath
  if (os === "macos") {
    json.configurations[0].macFrameworkPath = ["/System/Library/Frameworks"];
  }

  //Fifth, setup browse section
  json.configurations[0].browse = {
    path: [dirpath.fsPath],
    limitSymbolsToIncludedHeaders: true,
    databaseFilename: "",
  };

  // Sixth, setup toolchain path
  let toolchain = getChildProcessProsToolchainPath();
  if (toolchain !== undefined) {
    json.configurations[0].compilerPath = path.join(
      toolchain.replace(/"/g, ""),
      "bin",
      "arm-none-eabi-g++"
    );
  }

  // Seventh, make sure at least an empty file exists at the filepath
  try {
    fs.statSync(path.join(dirpath.fsPath, ".vscode"));
  } catch (error) {
    await promisify(fs.mkdir)(path.join(dirpath.fsPath, ".vscode"));
  }

  // Eighth, write/overwrite the file
  await promisify(fs.writeFile)(
    path.join(dirpath.fsPath, ".vscode", "c_cpp_properties.json"),
    JSON.stringify(json, null, 2)
  );

  if (debug) {
    // Log message if in debug mode
    console.log(
      "While checking on the c_cpp_properties.json file: c_cpp_properties.json file succesfully updated."
    );
  }
};

/**
 * This function generates and/or modifies the c_cpp_properties.json file which is used by the C/C++ extension to provide intellisense.
 *
 * @param debug This is a boolean that determines whether or not to log all potential matches + other debug messages
 * @returns Nothing
 */
export const generateCCppFiles = async (debug: boolean = false) => {
  const debugMsg = "While checking on the c_cpp_properties.json file: ";

  // First, check if the current workspace contains a pros project and exists
  if (
    (await workspaceContainsProsProject(true)) === false ||
    !vscode.workspace.workspaceFolders
  ) {
    // If the workspace doesn't contain a pros project, then we don't need to do anything
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "no pros project found in workspace!");
    }
    return;
  }

  // Second, create references to URIs we will need later, create other variables
  const workspaceRootUri = vscode.workspace.workspaceFolders[0].uri; // uri to top workspace folder
  const cCppPropertiesUri = vscode.Uri.joinPath(
    workspaceRootUri,
    ".vscode",
    "c_cpp_properties.json"
  ); // uri to c_cpp_properties.json file
  const os = getOperatingSystem(); // get user's OS
  let json; // json object to be populated shortly

  // Third, check if the c_cpp_properties.json file exists
  try {
    // Assume the file already exists, and modify it as needed:
    let response = await vscode.workspace.fs.stat(cCppPropertiesUri);
    let filedata = await promisify(fs.readFile)(
      cCppPropertiesUri.fsPath,
      "utf8"
    ); // read the file
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "file found.");
    }
    json = JSON.parse(filedata); // parse the file into a JSON object=
    await modifyCCppJson(workspaceRootUri, json, os, debug); // modify the file
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "file modified.");
    }
  } catch (e) {
    // The file does not exist. Create it and then modify it as needed:
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "file not found. Creating file...");
    }

    // Default file contents
    const defaultJSON = `{
      "configurations": [
          {
              "name": "PROS Project",
              "includePath": [
                  "\${workspaceFolder}/**"
              ],
              "defines": [
                  "_DEBUG",
                  "UNICODE",
                  "_UNICODE"
              ],
              "compilerPath": "C:/Program Files (x86)/Microsoft Visual Studio/2017/BuildTools/VC/Tools/MSVC/14.16.27023/bin/Hostx64/x64/cl.exe",
              "cStandard": "c17",
              "cppStandard": "c++17",
              "intelliSenseMode": "windows-msvc-x64"
          }
      ],
      "version": 4
    }`;

    // Convert into json object
    json = JSON.parse(defaultJSON);
    if (debug) {
      // Log message if in debug mode
      console.log(debugMsg + "file created."); //Technically this is a lie since the next line of code contains the write function, but this makes the print statements make sense.
    }
    await modifyCCppJson(workspaceRootUri, json, os, debug); // create + modify the file.
  }
};
