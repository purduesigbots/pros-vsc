import * as vscode from "vscode";
import * as fs from 'fs';
import { getNonce } from "./nonce";

export class ProsTemplateMarketplace 
    implements vscode.CustomTextEditorProvider
{
    private static readonly viewType = 'pros.templateMarketplace';
    // register as disposable
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new ProsTemplateMarketplace(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            ProsTemplateMarketplace.viewType,
            provider
        );
        return providerRegistration;
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
      ): Promise<void> {
        webviewPanel.webview.options = {
          enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    
        function updateWebview() {
          webviewPanel.webview.postMessage({
            type: "update",
            text: document.getText(),
          });
        }
      }
    
      
    private getHtmlForWebview(webview: vscode.Webview): string {
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "projectPros.js")
        );
        const nonce = getNonce();
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PROS Template Marketplace</title>
            <link rel="stylesheet" href="${styleResetUri}">
            <link rel="stylesheet" href="${styleVSCodeUri}">
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </head>
        <body>
            <h1>PROS TEMPLATE MARKETPLACE</h1>
        </body>
        </html>
        `;     
    }

}


export async function templateMarketplace(context: vscode.ExtensionContext, webview: vscode.Webview): Promise<string> {
  const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "reset.css")
  );
  const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "vscode.css")
  );
  const styleWelcomeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "welcome.css")
  );
  const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "projectPros.js")
  );
  const nonce = getNonce();
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PROS Template Marketplace</title>
      <link rel="stylesheet" href="${styleResetUri}">
      <link rel="stylesheet" href="${styleVSCodeUri}">
      <link rel="stylesheet" href="${styleWelcomeUri}">
      <script nonce="${nonce}" src="${scriptUri}"></script>
  </head>
  <body>
      <h1>PROS TEMPLATE MARKETPLACE</h1>
  </body>
  </html>
  `;     
}