import * as vscode from "vscode";
import * as path from "path";

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

  if (
    vscode.workspace
      .getConfiguration("pros")
      .get<boolean>("showWelcomeOnStartup")
  ) {
    vscode.commands.executeCommand("pros.welcome");
  }

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
      {
        enableScripts: true,
      }
    );

    const onDiskPath = vscode.Uri.file(
      path.join(context.extensionPath, "media", "welcome.css")
    );

    const cssPath = panel.webview.asWebviewUri(onDiskPath);
    const imgIconPath = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "media", "prosicon.png"))
    );
    const imgActionPath = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "prosquickaction.png")
      )
    );
    const imgProjectProsPath = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(context.extensionPath, "media", "projectpros.png")
      )
    );

    panel.webview.html = getWebviewContent(
      cssPath,
      imgIconPath,
      imgActionPath,
      imgProjectProsPath
    );
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
