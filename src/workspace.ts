import * as vscode from "vscode";

/*!
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
  let activeDir = undefined;

  const filenameSearch = "project.pros";

  if (active !== undefined) {
    console.log(`active: ${active}`);
    activeDir = vscode.workspace.getWorkspaceFolder(active)?.uri;
    console.log(`workspace folder: ${activeDir}`);
  } else if (
    vscode.workspace.workspaceFolders !== undefined &&
    vscode.workspace.workspaceFolders !== null
  ) {
    activeDir = vscode.workspace.workspaceFolders[0].uri;
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
