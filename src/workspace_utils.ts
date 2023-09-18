import * as vscode from "vscode";
import * as path from "path";

/**
 * This function searches a directory of the workspace for a file with the given name
 * 
 * @param filename This is the name of the file to search for (including extension)
 * @param dir This is the directory to search in. Ex. "src" or "include" or "src/chassis". "root" causes the entire workspace to be searched.
 * @param debug This is a boolean that determines whether or not to log all potential matches + other debug messages
 * @returns The Uri of the first matching file if any are found, null if directory or file not found
 */
export const findFile = async (filename: string, dir: string, debug: boolean = false): Promise<vscode.Uri | null> => {

  const debugMsg = "While searching for " + filename + " in " + dir + ": ";

  // Return null if either string or dir is undefined or null
  if (
    filename === undefined || 
    dir === undefined || 
    filename === null || 
    dir === null
    ) {
    if(debug) {
      // Log message if in debug mode
      console.log(debugMsg + "invalid input of some kind! ");
    }
    return null;
  }

  // Perform search operation
  if(dir === "root"){
    // Search entire workspace if dir is "root"
    var searchResults = await vscode.workspace.findFiles(filename);
  } else {
    // Search specified directory if dir is not "root". This is done by using glob patterns. 
    // Ex. "**/src/**/main.cpp" searches for "main.cpp" in any folder named "src" in the workspace, including all folders inside of all folders labeled "src" in the workspace.
    // NOTE: The use of vscode's joinPath is not necesary here, since everything is a web uri so regardless of user OS, it will be a standard forward slash for filepaths.
    var searchResults = await vscode.workspace.findFiles('**/' + dir + '/**/' + filename);
  }

  // vscode's findFiles function returns a thenable which operates as an array of URIs. Thus, we can use array functions on it:
  if (searchResults.length === 0) {
     // Return null if no files found
    if(debug) {
      // Log message if in debug mode
      console.log(debugMsg + "no matching files found!");
    }
    return null;
  } else if(debug) {
    // >= 1 matching file found, in debug mode
    searchResults.forEach((path) => {
      // Log all matching files found if in debug mode
      console.log(debugMsg + "matching file found: " + path);
    });
    
  }
  
  // Double check file exists (for some reason vscode's findFiles function returns files that don't exist for users of the web version of vscode sometimes)
  // (According to Benjamin Davis anyways)
  try{
    await vscode.workspace.fs.stat(searchResults[0]);
  } catch (err) {
    return null;
  }

  // Return first matching file found if any are found
  return searchResults[0];
};

/**
 * This function searches the workspace for all instances of a project.pros file. It then returns the names of the folders containing those files. 
 * It is used to offer the user a choice of which pros project to work on in the event there are multiple in the current workspace.
 * 
 * @returns An array of folder names containing every folder which houses a project.pros file in the workspace. Returns an empty array if none found.
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

  if(debug) {
    // Log list of found folders in workspace if in debug mode
    console.log(debugMsg + " candidate folders found: " + vscode.workspace.workspaceFolders);
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
        const workspaceUri = vscode.Uri.file(path.join(currentDir.fsPath, folder[0])); // uri to subfolder
        const uriString = `${workspaceUri.scheme}:${workspaceUri.path}/${"project.pros"}`; // uri path to project.pros file in subfolder (candidate)
        const uri = vscode.Uri.parse(uriString);
        
        // Check if candidate path actually leads to a project.pros file
        await vscode.workspace.fs.stat(uri);
      } catch (e) {
        // If not, set exists to false
        console.error(e);
        exists = false;
      }
      if (exists) {
        // We have confirmed that the candidate path leads to a project.pros file. Add this folder name to the array.
        array.push(folder);
      }
    }
  }
  
  if (debug) {
    // Log list of found folders in workspace if in debug mode
    console.log(debugMsg + " final list of folders found: " + array);
  }

  return array; // return array of folder names
};

/**
 * This function is a convinient wrapper for findFile. It searches the entire workspace for a project.pros file.
 * 
 * @returns A boolean indicating whether or not the current workspace contains a pros project
 */
export const workspaceContainsProsProject = async(debug: boolean = false): Promise<boolean> => {
  return (await findFile("project.pros", "root", debug)) !== null;
};

/**
 * This function is a convinient wrapper for findFile. It searches the entire workspace for a project.pros file.
 * 
 * @returns A vscode.Uri pointing to the directory containing the project.pros file, or null if no project.pros file found
 */
export const getProjectFileDir = async(debug: boolean = false): Promise<vscode.Uri | null> => {
  let fullUri =  await findFile("project.pros", "root", debug); // get uri of project.pros file
  if(fullUri === null) {
    // return null if no project.pros file found
    return null;
  }
  return vscode.Uri.file(path.dirname(fullUri.fsPath)); // return uri of directory containing project.pros file
};
