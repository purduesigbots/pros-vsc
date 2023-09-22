
// class Mouse{
//     x: number;
//     y: number;
//     leftDown: boolean = false;
//     rightDown: boolean = false;
//     middleDown: boolean = false;
//     dragging: boolean = false;
    
//     constructor(){
//         this.x = 0;
//         this.y = 0;
//     }

//     public update(e: MouseEvent){
//         this.x = e.clientX;
//         this.y = e.clientY;
//     }

//     public update(_x: number, _y: number){
//         this.x = _x;
//         this.y = _y;
//     }

//     /**
//      * Returns whether or not the mouse is hovering over a V5Device
//      * 
//      * @param v5Device The V5Device to check
//      */
//     public hover(v5Device: V5Device): boolean{
//         return !dragging && 
//             (
//                 this.x >= v5Device.getHtmlX() && 
//                 this.x <= v5Device.getHtmlX() + v5Device.self.clientWidth && 
//                 this.y >= v5Device.getHtmlY() && 
//                 this.y <= v5Device.getHtmlY() + v5Device.self.clientHeight
//             );
//     }
// }

// abstract class V5Device{
//     type: string;
//     name: string;
//     port: V5Port;
//     x: number;
//     y: number;
//     hover: boolean = false;
//     beingDragged: boolean = false;
//     canvas: HTMLCanvasElement;
//     self: HTMLElement; // the html element of the device
//     mouse: Mouse; // the mouse object

//     constructor(_type: string, _name: string, _port: V5Port, _x: number, _y: number, _canvas: HTMLCanvasElement, _self: HTMLElement, _mouse: Mouse){
//         this.type = _type;
//         this.name = _name;
//         this.port = _port;
//         this.canvasX = _x;
//         this.canvasY = _y;
//         this.canvas = _canvas;
//         this.self = _self;
//         this.mouse = _mouse;
//     }

//     private abstract getImgUri(): vscode.Uri;

//     get hover(){
//         this.hover = this.mouse.hover(this); // Yay classes lol
//     }

//     public update(mouse: Mouse): void{
//         if(this.mouse.leftDown && this.hover){
//             this.beingDragged = true; // 
//         }
//     }

//     set canvasX(htmlX: number){
//         this.canvasX = htmlX - this.canvas.getBoundingClientRect().left;
//     }

//     set canvasY(htmlY: number){
//         this.canvasY = htmlY - this.canvas.getBoundingClientRect().top;
//     }

//     public getHtmlX(): number{
//         return this.canvasX + this.canvas.getBoundingClientRect().left;
//     }

//     public getHtmlY(): number{
//         return this.canvasY + this.canvas.getBoundingClientRect().top;
//     }

//     public getCanvasX(): number{
//         return this.canvasX;
//     }

//     public getCanvasY(): number{
//         return this.canvasY;
//     }

// }

// class V5Motor extends V5Device{
//     reversed: boolean;
//     wattage: number;
//     port: V5Port;
//     rpm: number;

//     constructor(_name: string, _port: V5Port, _x: number, _y: number, _canvas: HTMLCanvasElement, _reversed: boolean, _wattage: number, _rpm: number = 200, _self: HTMLElement, _mouse: Mouse){
//         _type = _wattage.toString() + "W Motor";
//         super(_type, _name, _port, _x, _y, _canvas, _self, _mouse);
//         this.reversed = _reversed;
//         this.wattage = _wattage;
//         this.rpm = _rpm;
//     }

//     private getImgUri(): vscode.Uri{
//         const imgPath = path.join(context.extensionPath, "media", wattage.toString() + "W_Motor_" + this.rpm.toString() + ".png");
//         return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
//     }


// }

// class V5Port{
//     port: number;
//     device: V5Device | null = null;
//     x: number;
//     y: number;
//     constructor(_port: number){
//         this.port = _port;
//     }
// }

var deviceTable = document.getElementById("device-table");
var portTable = document.getElementById("ports-table");
var deviceRows = document.getElementsByClassName("device-row");
var deviceCols = document.getElementsByClassName("device-col");
var portRows = document.getElementsByClassName("port-row");
var portCols = document.getElementsByClassName("port-col");
var debug: HTMLElement = document.getElementById("debug");
debug.innerHTML = "doing something!";
var ports = [];
for(var i = 0, port; i < 21; i++){
    ports.push(new V5Port(i+1)); // Ports are 1-indexed
}

window.onload = function(){
    //Add event listeners to each device entry
    for(var i = 0, row; row = deviceRows[i]; i++){
        for(var j = 0, col; col = deviceCols[i * j + j]; j++){
            console.log("adding event listener to device entry");
            col.addEventListener("mousedown", function(){
                this.style.border = "5px solid red";
                console.log("mouseover!!!");
            });
        }
    }
};