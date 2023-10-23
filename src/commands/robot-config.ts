import { getNonce } from "../views/nonce";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

var panelIsOpen = false;
var panel: vscode.WebviewPanel | undefined = undefined;
var runningCallback = false;

/**
 * This function starts the robot configurator webview.
 * 
 * @param context The vscode extension context
 * @param analytics The analytics object
 * @param betaFeature Whether or not this is a beta feature
 * @param customAnalytic The custom analytic to send to Google Analytics
 * @param debug Whether or not to print debug messages
 * @returns Nothing
 */
async function robotConfig(
    context: vscode.ExtensionContext | undefined | null, 
    analytics: Analytics,
    betaFeature: boolean = false, 
    customAnalytic: string | undefined | null, 
    debug: boolean = false
): Promise<void> {
    runningCallback = true;
    const debugMsg = "While setting up robot config webview: ";

    // Check if context is not working
    if (context === undefined || context === null) {
        if(debug) {
            console.log(debugMsg + "context is undefined or null");
        }
        runningCallback = false;
        return;
    }

    // Check if beta feature and if beta features are enabled
    if(betaFeature && !vscode.workspace.getConfiguration("pros").get("Beta: Enable Experimental Features")) {
        await vscode.window.showErrorMessage("This feature is currently in beta. To enable it, set the 'pros.Beta: Enable Experimental Features' setting in your workspace settings to true.");
        return;
    }

    // Do analytics
    if(customAnalytic !== null) {
        analytics.sendAction(
            customAnalytic ? customAnalytic : "robot-config",
        );
    }

    // Check if panel is already open
    if(panelIsOpen) {
        if(debug) {
            console.log(debugMsg + "panel is already open");
        }
        panel.reveal();
        runningCallback = false;
        return;
    }

    // Panel object
    panel = vscode.window.createWebviewPanel(
        'robot_config',
        'Robot Configurator',
        vscode.ViewColumn.Two,
        {
            enableScripts: true, // enable javascript in the webview
            localResourceRoots: [vscode.Uri.file(context.extensionPath)] // allow access to the extension's resources
        }
    ); // webview options

    if(debug) {
        console.log(debugMsg + "Panel created");
        console.log(debugMsg + "Preparing to read html file");
    }

    // Create consts for nonce (whitelists scripts), html, and script
    const nonce = getNonce();
    const htmlPath = path.join(context.extensionPath, "src", "robot-config-gui", "robot_config.html"); 
    var html = fs.readFileSync(htmlPath, "utf-8");
    const scriptPath = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "src", "robot-config-gui", "robot_config.js")));
    const cssPath = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "src", "robot-config-gui", "robot_config.css")));
    const resizeScriptPath = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, "src", "robot-config-gui", "resize_tables.js")));
    const nonce2 = getNonce();

    if(debug) {
        console.log(debugMsg + "Html file read");
        console.log(debugMsg + "Replacing placeholders");
    }

    html = html.replace("%%NONCE%%", nonce);
    html = html.replace("%%SCRIPT_PATH%%", scriptPath.toString());
    html = html.replace("%%CSS_PATH%%", cssPath.toString());
    html = html.replace("%%SCRIPT_PATH2%%", resizeScriptPath.toString());
    html = html.replace("%%NONCE2%%", nonce2);

    if(debug) {
        console.log(debugMsg + "Placeholders replaced");
        console.log(debugMsg + "setup successful.");
    }

    // Set the html
    panel.webview.html = html;

    panel.onDidDispose(() => {
        panelIsOpen = false; // set panelIsOpen to false when the panel is closed
    });

    runningCallback = false;
    panelIsOpen = true; // set panelIsOpen to true when the panel is opened
};

/**
 * Sets up the tree view button to open the robot configurator.
 * 
 * @param context The vscode extension context
 * @param analytics The analytics object
 * @param betaFeature Whether or not this is a beta feature
 * @param customAnalytic A custom analytic message
 * @param debug Whether or not to print debug messages
 * @returns Nothing
 */
export async function setupRobotConfigCommandBlocker(
    context: vscode.ExtensionContext, 
    analytics: Analytics,
    betaFeature: boolean = false, 
    customAnalytic: string | undefined | null, 
    debug: boolean = false
): Promise<void> {
    const debugMsg = "While setting up robot config command blocker: ";

    if(context === undefined || context === null) {
        if(debug) {
            console.log(debugMsg + "context is undefined or null");
        }
        return;
    }

    vscode.commands.registerCommand("pros.robotconfig", async() => {
        if(!runningCallback){
            await robotConfig(context, analytics, betaFeature, customAnalytic, debug);
        }
    });
};

