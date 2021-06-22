import * as vscode from "vscode";

import { TreeDataProvider } from "./views/tree-view";
import { getWebviewContent } from "./views/welcome-view";
import {
  buildUpload,
  clean,
  build,
  createNewProject,
  upgradeProject,
  upload,
} from "./commands";
import { ProsProjectEditorProvider } from "./editor";
import { Analytics } from "./ga";

let analytics: Analytics;

export function activate(context: vscode.ExtensionContext) {
  analytics = new Analytics(context);

  workspaceContainsProjectPros().then((value) => {
      vscode.commands.executeCommand("setContext", "pros.isPROSProject", value);
  });

  const terminal = vscode.window.createTerminal("PROS Terminal");
  terminal.sendText("pros build-compile-commands");

  vscode.commands.registerCommand("pros.upload&build", () => {
    analytics.sendAction("upload&build");
    buildUpload();
  });

  vscode.commands.registerCommand("pros.upload", () => {
    analytics.sendAction("upload");
    upload();
  });

  vscode.commands.registerCommand("pros.build", () => {
    analytics.sendAction("build");
    build();
  });

  vscode.commands.registerCommand("pros.clean", clean);

  vscode.commands.registerCommand("pros.terminal", () => {
    terminal.show();
    terminal.sendText("pros terminal");
  });

  vscode.commands.registerCommand("pros.upgrade", () => {
    analytics.sendAction("upgrade");
    upgradeProject();
  });

  vscode.commands.registerCommand("pros.new", () => {
    analytics.sendAction("projectCreated");
    createNewProject();
  });

  vscode.commands.registerCommand("pros.welcome", () => {
    analytics.sendPageview("welcome");
    const panel = vscode.window.createWebviewPanel(
      "welcome",
      "Welcome",
      vscode.ViewColumn.One,
      {}
    );
    panel.webview.html = getWebviewContent();
  });

  vscode.window.registerTreeDataProvider(
    "prosTreeview",
    new TreeDataProvider()
  );

  context.subscriptions.push(ProsProjectEditorProvider.register(context));
}

export function deactivate() {
  analytics.endSession();
}

async function workspaceContainsProjectPros(): Promise<boolean> {
  const filename = "project.pros";

  if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders === null) {
    return false;
  }

  let exists = true;
  try {
    // By using VSCode's stat function (and the uri parsing functions), this code should work regardless
    // of if the workspace is using a physical file system or not.
    const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    const uriString = `${workspaceUri.scheme}:${workspaceUri.path}/${filename}`;
    const uri = vscode.Uri.parse(uriString);
    await vscode.workspace.fs.stat(uri);
  } catch (e) {
    console.error(e);
    exists = false;
  }
  return exists;
}
