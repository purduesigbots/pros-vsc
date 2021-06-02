import * as vscode from "vscode";

export class ProsProjectEditorProvider
  implements vscode.CustomTextEditorProvider
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ProsProjectEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ProsProjectEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "pros.projectEditor";

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    webviewPanel.webview.postMessage({
      type: "update",
      text: document.getText(),
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return "Hello!";
  }
}
