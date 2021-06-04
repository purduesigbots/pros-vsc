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

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
      // switch (e.type) {
      //   case "add":
      //     this.addNewScratch(document);
      //     return;
      //   case "delete":
      //     this.deleteScratch(document, e.id);
      //     return;
      // }
    });

    updateWebview();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
    );

    // const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
      </head>
      <body>
        <div class="settings-group-title-label settings-row-inner-container settings-group-level-1 settings-group-first">
          PROS Project Settings
        </div>

        <div class="setting-item-contents settings-row-inner-container">
          <div class="setting-item-title">
            <div class="setting-item-cat-label-container">
              <span class="setting-item-category" title="files.autoSave">
                Upload: 
              </span>
              <span class="setting-item-label" title="files.autoSave">
                Program Slot
              </span>
            </div>
          </div>
          <div class="setting-item-description">
            <div class="setting-item-markdown">
              <p>
                Set the Program Slot number that this project will be uploaded into on the V5 brain.
              </p>
            </div>
          </div>
          <div class="setting-item-value">
            <div class="setting-item-control select-container">
              <select class="monaco-select-box monaco-select-box-dropdown-padding setting-control-focus-target" tabindex="-1" title="off" style="background-color: rgb(60, 60, 60); color: rgb(240, 240, 240); border-color: rgb(60, 60, 60);" data-focusable="true">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>
          </div>
        </div>

        <div class="setting-item-contents settings-row-inner-container">
          <div class="setting-item-title">
            <div class="setting-item-cat-label-container">
              <span class="setting-item-category" title="files.autoSave">
                Upload: 
              </span>
              <span class="setting-item-label" title="files.autoSave">
                Project Name
              </span>
            </div>
          </div>
          <div class="setting-item-description">
            <div class="setting-item-markdown">
              <p>
                This shows as the program's name on the brain when uploaded.
              </p>
            </div>
          </div>
          <div class="setting-item-value">
            <div class="setting-item-control">
              <div class="monaco-inputbox" style="background-color: rgb(60, 60, 60); color: rgb(204, 204, 204);">
                <div class="ibwrapper">
                  <input class="input setting-control-focus-target" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" wrap="off" tabindex="-1" data-focusable="true" style="background-color: inherit; color: rgb(204, 204, 204);">
                </div>
              </div>
            </div>
          </div>
        </div>
      </html>`;
  }
}
