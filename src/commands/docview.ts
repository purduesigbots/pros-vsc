import * as vscode from "vscode";
import * as path from "path";
import { parseJSON } from "./prosDocs";


export async function opendocs(link: string)
{
    let currConfig = getStyle();
    const panel = vscode.window.createWebviewPanel(
        'prosDocView', // Identifies the type of the webview. Used internally
        'PROS Documentation View', // Title of the panel displayed to the user
        currConfig === "right" ? vscode.ViewColumn.Beside : vscode.ViewColumn.Beside
        //vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        // Webview options. More on these later.
    );

    const updateWebview = () => {
        panel.webview.html = getWebviewContent(link);
    };
/*
    vscode.languages.registerHoverProvider('typescript', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // TODO: add function call to validate word and replace value with updated value
            if (parseJSON(word)) {
                return {
                    contents: ["Word"]
                };
            }
        }
    });
    */

    updateWebview();
};

function getWebviewContent(link: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PROS Documentation View</title>
    </head>
    <body>
        <iframe src="${link}" width="600" height="800" frameborder="0"></iframe>
    </body>
    </html>`;
}

function getStyle() {
    return vscode.workspace.getConfiguration("pros").get<string>("Style");
}