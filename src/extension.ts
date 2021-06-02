import * as vscode from "vscode";

import { TreeDataProvider } from "./views/tree-view";
import { getWebviewContent } from "./views/welcome-view";
import { createNewProject, upgradeProject, upload } from "./commands";
import { ProsProjectEditorProvider } from "./editor";

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

  vscode.commands.registerCommand("pros.upload", upload);

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

  vscode.commands.registerCommand("pros.upgrade", upgradeProject);

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

  context.subscriptions.push(ProsProjectEditorProvider.register(context));
}

export function deactivate() {}
