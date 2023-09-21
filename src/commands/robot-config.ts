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

    if(debug) {
        console.log(debugMsg + "Html file read");
        console.log(debugMsg + "Replacing placeholders");
    }

    html = html.replace("%%NONCE%%", nonce);
    html = html.replace("%%SCRIPT_PATH%%", scriptPath.toString());
    html = html.replace("%%CSS_PATH%%", cssPath.toString());

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

export class Mouse{
    x: number;
    y: number;
    leftDown: boolean = false;
    rightDown: boolean = false;
    middleDown: boolean = false;
    dragging: boolean = false;
    
    constructor(){
        this.x = 0;
        this.y = 0;
    }

    public update(e: MouseEvent){
        this.x = e.clientX;
        this.y = e.clientY;
    }

    public update(_x: number, _y: number){
        this.x = _x;
        this.y = _y;
    }

    /**
     * Returns whether or not the mouse is hovering over a V5Device
     * 
     * @param v5Device The V5Device to check
     */
    public hover(v5Device: V5Device): boolean{
        return !dragging && 
            (
                this.x >= v5Device.getHtmlX() && 
                this.x <= v5Device.getHtmlX() + v5Device.self.clientWidth && 
                this.y >= v5Device.getHtmlY() && 
                this.y <= v5Device.getHtmlY() + v5Device.self.clientHeight
            );
    }
}

export abstract class V5Device{
    type: string;
    name: string;
    port: V5Port;
    private canvasX: number;
    private canvasY: number;
    hover: boolean = false;
    beingDragged: boolean = false;
    canvas: HTMLCanvasElement;
    self: HTMLElement; // the html element of the device
    mouse: Mouse; // the mouse object

    constructor(_type: string, _name: string, _port: V5Port, _x: number, _y: number, _canvas: HTMLCanvasElement, _self: HTMLElement, _mouse: Mouse){
        this.type = _type;
        this.name = _name;
        this.port = _port;
        this.canvasX = _x;
        this.canvasY = _y;
        this.canvas = _canvas;
        this.self = _self;
        this.mouse = _mouse;
    }

    private abstract getImgUri(): vscode.Uri;

    get hover(){
        this.hover = this.mouse.hover(this); // Yay classes lol
    }

    public update(mouse: Mouse): void{
        if(this.mouse.leftDown && this.hover){
            this.beingDragged = true; // 
        }
    }

    set canvasX(htmlX: number){
        this.canvasX = htmlX - this.canvas.getBoundingClientRect().left;
    }

    set canvasY(htmlY: number){
        this.canvasY = htmlY - this.canvas.getBoundingClientRect().top;
    }

    public getHtmlX(): number{
        return this.canvasX + this.canvas.getBoundingClientRect().left;
    }

    public getHtmlY(): number{
        return this.canvasY + this.canvas.getBoundingClientRect().top;
    }

    public getCanvasX(): number{
        return this.canvasX;
    }

    public getCanvasY(): number{
        return this.canvasY;
    }

}

export class V5Motor extends V5Device{
    reversed: boolean;
    wattage: number;
    port: V5Port;
    rpm: number;

    constructor(_name: string, _port: V5Port, _x: number, _y: number, _canvas: HTMLCanvasElement, _reversed: boolean, _wattage: number, _rpm: number = 200, _self: HTMLElement, _mouse: Mouse){
        _type = _wattage.toString() + "W Motor";
        super(_type, _name, _port, _x, _y, _canvas, _self, _mouse);
        this.reversed = _reversed;
        this.wattage = _wattage;
        this.rpm = _rpm;
    }

    private getImgUri(): vscode.Uri{
        const imgPath = path.join(context.extensionPath, "media", wattage.toString() + "W_Motor_" + this.rpm.toString() + ".png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }


}

export class V5Port{
    port: number;
    device: V5Device | null;
    x: number;
    y: number;
}