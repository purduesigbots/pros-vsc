import * as vscode from "vscode";

import { TreeDataProvider } from "./views/tree-view";
import { getWebviewContent } from "./views/welcome-view";
import { createNewProject } from "./commands/create-project";

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand("pros.helloWorld", () =>
    vscode.window.showInformationMessage("Hello World from pros!")
  );
  const terminal = vscode.window.createTerminal("PROS Terminal");
  // terminal.sendText("pros build-compile-commands");

  vscode.commands.registerCommand("pros.upload&build", () => {
    terminal.show();
    terminal.sendText("pros mu");
  });

  vscode.commands.registerCommand("pros.upload", () => {
    terminal.show();
    terminal.sendText("pros upload");
  });

  vscode.commands.registerCommand("pros.build", () => {
    terminal.show();
    terminal.sendText("pros make");
  });

  vscode.commands.registerCommand("pros.clean", () => {
    terminal.show();
    terminal.sendText("pros make clean");
  });

  vscode.commands.registerCommand("pros.terminal", () => {
    terminal.show();
    terminal.sendText("pros terminal");
  });

  vscode.commands.registerCommand("pros.upgrade", () => {
    terminal.show();
    terminal.sendText("pros conduct upgrade");
    // TODO: do this like creating the project
  });

  vscode.commands.registerCommand("pros.new", createNewProject);

  vscode.commands.registerCommand("pros.welcome", () => {
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
}

export function deactivate() {}
