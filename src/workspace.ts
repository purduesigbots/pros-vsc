import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

/*!
  * @brief This function returns the current working directory (vscode.Uri) and if it is a pros project (boolean)
  * @return [vscode.Uri, boolean]
  * 
  * @details This function firstly looks at the workspace for the active text editor. If there is no active text editor, it will use the 0th index of the workspace folders. 
  * If there are no workspace folders, it will throw an error. If the workspace folder is a pros project, it will return the workspace folder and true. 
  * If the workspace folder is not a pros project, it will return the workspace folder and false.
  * 
  */

export const get_cwd_is_pros = async (): Promise<[vscode.Uri, boolean]> => {
    //output the 0th workspace folder
  
    let active = vscode.window.activeTextEditor?.document.uri ?? undefined;
    let active_dir = undefined;
  
    const filename_search = "project.pros";
    let is_pros_project = true;
  
  
    if(active !== undefined) {
      console.log(`active: ${active}`);
      active_dir = vscode.workspace.getWorkspaceFolder(active)?.uri;
      console.log(`workspace folder: ${active_dir}`);
    } else if(vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders !== null) {
        active_dir = vscode.workspace.workspaceFolders[0].uri;
    } 
  
    if(active_dir === undefined || active_dir === null) {
      throw(new Error("No workspace folder found"));
    }
  
  
    // use fs to check if the active directory contains a project.pros file
    try {
      await vscode.workspace.fs.stat(vscode.Uri.joinPath(active_dir, filename_search));
    } catch (err) {
      is_pros_project = false;
    }
    return [active_dir, is_pros_project];
  
  }


  