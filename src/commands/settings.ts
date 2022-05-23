import * as vscode from "vscode";
import * as path from "path";
import {workspaceContainsProjectPros} from "../extension";
import {ProsProjectEditorProvider} from "../views/editor";
export const settings = async () => {
    let projectOpen = await workspaceContainsProjectPros();
    if(!projectOpen) {
        vscode.window.showErrorMessage("Please Open a PROS Project!");
        return;
    }

    const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    const uriString = `${workspaceUri.scheme}:${workspaceUri.path}/project.pros`;
    const uri = vscode.Uri.parse(uriString);
    console.log(uri);
    vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        "pros.projectEditor"
      );
}