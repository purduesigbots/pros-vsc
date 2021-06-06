import * as vscode from "vscode";

// Used to whitelist scripts?
export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

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
      switch (e.type) {
        case "setSlot":
          this.setSlot(document, e);
          return;
        case "setName":
          this.setName(document, e);
          return;
      }
    });

    updateWebview();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "projectPros.js")
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
    );

    const nonce = getNonce();

    // TODO: run after upload option?
    // TODO: just need to get the editor writing to the document now

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
                Set the Program Slot number that this project will be uploaded into by default on the V5 brain.
              </p>
            </div>
          </div>
          <div class="setting-item-value">
            <div class="setting-item-control select-container">
              <select id="slotSelection" class="monaco-select-box monaco-select-box-dropdown-padding setting-control-focus-target" tabindex="-1" title="off" style="background-color: rgb(60, 60, 60); color: rgb(240, 240, 240); border-color: rgb(60, 60, 60);" data-focusable="true">
                ${[1, 2, 3, 4, 5, 6, 7, 8].forEach(i => `<option value="${i}">${i}</option>`)}
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
                  <input id="projectName" class="input setting-control-focus-target" autocorrect="off" autocapitalize="off" spellcheck="false" type="text" wrap="off" tabindex="-1" data-focusable="true" style="background-color: inherit; color: rgb(204, 204, 204);">
                </div>
              </div>
            </div>
          </div>
        </div>

        <script nonce="${nonce}" src="${scriptUri}"></script>

      </body>
    </html>`;
  }

  private setSlot(document: vscode.TextDocument, e: any) {
    const json = this.getDocumentAsJson(document);

    json["py/state"]["upload_options"]["slot"] = e["slot"];

    return this.updateTextDocument(document, json);
  }

  private setName(document: vscode.TextDocument, e: any) {
    const json = this.getDocumentAsJson(document);

    json["py/state"]["project_name"] = e["projectName"];

    return this.updateTextDocument(document, json);
  }

  /**
   * Try to get a current document as json text.
   */
  private getDocumentAsJson(document: vscode.TextDocument): any {
    const text = document.getText();
    if (text.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "Could not get document as json. Content is not valid json"
      );
    }
  }

  /**
   * Write out the json to a given document.
   */
  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2)
    );

    return vscode.workspace.applyEdit(edit);
  }
}
