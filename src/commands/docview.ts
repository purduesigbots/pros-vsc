import * as vscode from "vscode";
import * as path from "path";

let currConfig = vscode.workspace.getConfiguration("pros").get<option

export async function opendocs()
{
    const panel = vscode.window.createWebviewPanel(
        'prosDocView', // Identifies the type of the webview. Used internally
        'PROS Documentation View', // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        // Webview options. More on these later.
    );

    const updateWebview = () => {
        panel.webview.html = getWebviewContent();
    };

    updateWebview();
};

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PROS Documentation View</title>
    </head>
    <body>
        <iframe src="https://pros.cs.purdue.edu/v5/" width="800" height="1000" frameborder="0"></iframe>
    </body>
    </html>`;
}

function setStyle() {
    let currConfig = vscode.workspace.getConfiguration("pros").get<option type: int, boolean
}