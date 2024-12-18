import * as vscode from "vscode";
import {
  getCurrentPort,
  getV5ComPorts,
  getV5DeviceInfo,
  setName,
  setPort,
  setTeam,
} from "../device";
import { getNonce } from "./nonce";
try {
  var usb = require("usb").usb;
} catch (err) {
  usb = null;
}

export class BrainViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "pros.brainView";

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _disabled: boolean = false
  ) {
    console.log("BrainViewProvider constructor: " + _disabled);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "updateDeviceList":
          this.updateDeviceList();
          break;
        case "setPort":
          setPort(data.port);
          this.updatePortInfo();
          break;
        case "setName":
          setName(data.name);
          break;
        case "setTeam":
          setTeam(data.team);
          break;
      }
    });
    if (usb) {
      usb.addListener("attach", () => {
        setTimeout(() => {
          this.updateDeviceList();
        }, 1000);
      });
      usb.addListener("detach", () => {
        setTimeout(() => {
          this.updateDeviceList();
        }, 1000);
      });
    }
    this.updateDeviceList();
  }

  public updatePortInfo() {
    getV5DeviceInfo(getCurrentPort()).then((deviceInfo) => {
      this._view?.webview.postMessage({
        type: "deviceInfo",
        deviceInfo: deviceInfo,
      });
    });
  }

  public updateDeviceList() {
    let deviceList = getV5ComPorts();
    if (this._view) {
      this._view.webview.postMessage({
        type: "deviceList",
        deviceList: deviceList,
        currentDevice: getCurrentPort(),
      });
      if (deviceList.length !== 0) {
        this.updatePortInfo();
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    if (this._disabled) {
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Brain View</title>
      </head>
      <body>
          <h1>This is an Expiremental Feature</h1>
          <p>It is currently disabled. To enable it, enable "Pros: Beta: Enable Experimental Features" in your VSCode settings and restart VSCode.</p>
      </body>
      </html>
      `;
    }

    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "brainView.js")
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "brainView.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                    Use a content security policy to only allow loading styles from our extension directory,
                    and only allow scripts that have a specific nonce.
                    (See the 'webview-sample' extension sample for img-src content security policy examples)
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <title>Brain View</title>
            </head>
            <body>
                <div class="body__container">
                    <select id="brain_list" class="selection monaco-select-box">
                    </select>
                    <p>Name:</p>
                    <input id="name">
                    <p>Team:</p>
                    <input id="team">
                    <p id="programs">
                    <p id="brain_info">
                    <p id="device_container">
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}
