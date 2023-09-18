import * as vscode from "vscode";
import * as path from "path";

/** 
 * @brief This function returns the current working directory (vscode.Uri) and if it is a pros project (boolean)
 * @return [vscode.Uri, boolean]
 *
 * @details This function firstly looks at the workspace for the active text editor. If there is no active text editor, it will use the 0th index of the workspace folders.
 * If there are no workspace folders, it will throw an error. If the workspace folder is a pros project, it will return the workspace folder and true.
 * If the workspace folder is not a pros project, it will return the workspace folder and false.
 *
 */

export const getCwdIsPros = async (): Promise<vscode.Uri | null> => {
  //output the 0th workspace folder

  let active = vscode.window.activeTextEditor?.document.uri ?? undefined;
  let activeDir = null;

  const filenameSearch = "project.pros";
  let prosProjects = await vscode.workspace.findFiles(filenameSearch);

  if (prosProjects.length === 1) {
    console.log(`pros project: ${prosProjects[0].path}`);
    activeDir = vscode.Uri.file(path.dirname(prosProjects[0].fsPath));
  } else if (active !== undefined) {
    console.log(`active: ${active}`);
    let potentialDir = vscode.workspace.getWorkspaceFolder(active);
    prosProjects.forEach((path) => {
      if (potentialDir === vscode.workspace.getWorkspaceFolder(path)) {
        activeDir = potentialDir?.uri;
      }
    });
  }

  if (activeDir === undefined || activeDir === null) {
    return null;
  }

  // use fs to check if the active directory contains a project.pros file
  try {
    await vscode.workspace.fs.stat(
      vscode.Uri.joinPath(activeDir, filenameSearch)
    );
  } catch (err) {
    return null;
  }
  return activeDir;
};


/**
 * This function searches a directory of the workspace for a file with the given name
 * 
 * @param filename This is the name of the file to search for (including extension)
 * @param dir This is the directory to search in. Ex. "src" or "include" or "src/chassis". "root" causes the entire workspace to be searched.
 * @param debug This is a boolean that determines whether or not to log all potential matches + other debug messages
 * @returns The Uri of the first matching file if any are found, null if directory or file not found
 */
export const findFile = async (filename: string, dir: string, debug: boolean = false): Promise<vscode.Uri | null> => {

  let rootUri = vscode.window.activeTextEditor?.document.uri ?? undefined;
  const debugMsg = "While searching for " + filename + " in " + dir + ": ";

  // Return null if there is no active text editor or either string or dir is undefined or null
  if (
    rootUri === undefined || 
    filename === undefined || 
    dir === undefined || 
    filename === null || 
    dir === null
    ) {
    if(debug) {
      // Log message if in debug mode
      console.log(debugMsg + "invalid input of some kind!");
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
export async function prosProjects(debug: boolean = false) {

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
    console.log(vscode.workspace.workspaceFolders);
  }

  for (const workspace of vscode.workspace.workspaceFolders) {
    const currentDir = workspace.uri;
    const folders = await vscode.workspace.fs.readDirectory(currentDir);
    for (const folder of folders) {
      var exists = true;
      try {
        // By using VSCode's stat function (and the uri parsing functions), this code should work regardless
        // of if the workspace is using a physical file system or not.
        const workspaceUri = vscode.Uri.file(
          path.join(currentDir.fsPath, folder[0])
        );
        const uriString = `${workspaceUri.scheme}:${
          workspaceUri.path
        }/${"project.pros"}`;
        const uri = vscode.Uri.parse(uriString);
        await vscode.workspace.fs.stat(uri);
      } catch (e) {
        console.error(e);
        exists = false;
      }
      if (exists) {
        array.push(folder);
      }
    }
  }
  console.log(array);
  return array;
}