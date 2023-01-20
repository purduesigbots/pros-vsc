import * as vscode from "vscode";
import * as path from "path";

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
