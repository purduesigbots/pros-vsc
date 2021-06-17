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

  const terminal = vscode.window.createTerminal("PROS Terminal");
  terminal.sendText("pros build-compile-commands");

  vscode.commands.registerCommand("pros.upload&build", () => {
    analytics.sendAction("build");
    buildUpload();
  });

  vscode.commands.registerCommand("pros.upload", upload);

  vscode.commands.registerCommand("pros.build", () => {
    analytics.sendAction("build");
    build();
  });

  vscode.commands.registerCommand("pros.clean", clean);

  vscode.commands.registerCommand("pros.terminal", () => {
    terminal.show();
    terminal.sendText("pros terminal");
  });

  vscode.commands.registerCommand("pros.upgrade", upgradeProject);

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
