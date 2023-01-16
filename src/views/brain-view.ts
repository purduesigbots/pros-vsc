import * as vscode from 'vscode';
import { getCurrentPort, getV5ComPorts, getV5DeviceInfo, setPort, setSlot } from '../device';
import { getNonce } from './nonce';

export class BrainViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'pros.brainView';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView, 
        context: vscode.WebviewViewResolveContext, 
        _token: vscode.CancellationToken,
        ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(data => {
            switch(data.type) {
                case "updateDeviceList":
                    this.updateDeviceList();
                    break;
                case "setPort":
                    setPort(data.port);
                    break;
                case "setSlot":
                    setSlot(data.slot);
                    break;
                case "runCommand":
                    vscode.commands.executeCommand(data.command);
                    break;
            }
        });
        this.updateDeviceList();
    }

    public updatePortInfo() {
        getV5DeviceInfo(getCurrentPort()).then(deviceInfo => {
            this._view?.webview.postMessage({
                type: "deviceInfo",
                deviceInfo: deviceInfo
            });
        });
    }

    public updateDeviceList() {
        let deviceList = getV5ComPorts();
        if (this._view) {
            this._view.webview.postMessage({
                type: "deviceList",
                deviceList: deviceList,
                currentDevice: getCurrentPort()
            });
            if (deviceList.length !== 0) {
                this.updatePortInfo();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'brainView.js'));

        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'brainView.css'));

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
                    <select id="brain_list" class="selection">
                    </select>
                    <select id="slot_list" class="selection">
                    </select>
                    <div class="button_group">
                        <button id="run_button">Run Program</button>
                        <button id="stop_button">Stop Program</button>
                        <button id="team_number">Set Team Number</button>
                        <button id="robot_name">Set Robot Name</button>
                        <button id="update_vexos">Update VEXos</button>
                        <button id="battery_medic">Run Battery Medic</button>
                    </div>
                    <div class="info_group">
                        <p id="name">Name</p>
                        <p id="team">Team</p>
                        <p id="vexos">vexos</p>
                        <p id="cpu0">cpu0</p>
                        <p id="cpu1">cpu1</p>
                    </div>
                    <div id="device_container" class="info_group">
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}