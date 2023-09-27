
class Mouse{
    x;
    y;
    leftDown = false;
    rightDown = false;
    middleDown = false;
    dragging = false;
    
    constructor(){
        this.x = 0;
        this.y = 0;
    }

    update(e){
        this.x = e.clientX;
        this.y = e.clientY;
    }

    update(_x, _y){
        this.x = _x;
        this.y = _y;
    }

    /**
     * Returns whether or not the mouse is hovering over a V5Device
     * 
     * @param v5Device The V5Device to check
     */
    hover(v5Device){
        return !dragging && 
            (
                this.x >= v5Device.getHtmlX() && 
                this.x <= v5Device.getHtmlX() + v5Device.self.clientWidth && 
                this.y >= v5Device.getHtmlY() && 
                this.y <= v5Device.getHtmlY() + v5Device.self.clientHeight
            );
    }
}

class V5Device{
    type;
    name;
    port;
    self; // the html element of the device
    mouse; // the mouse object

    /**
     * Constructs and initializes a new V5Device
     * 
     * @param {String} _type Device type name e.g. "Rotation Sensor"
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {number | String} _port Integer port number, 1-21
     * @param {HTMLElement} _self HTML element of the device
     * @param {Mouse} _mouse Mouse object
     */
    constructor(_type, _name, _port, _self, _mouse){
        if(this.constructor === V5Device){
             throw new Error("Cannot instantiate abstract class V5Device");
        }
        this.type = _type;
        this.name = _name;
        this.port = _port;
        this.self = _self;
        this.mouse = _mouse;
    }

    getImgUri(){
        throw new Error("Method not implemented.");
    }

    get hover(){
        return this.mouse.hover(this); // Yay classes lol
    }

    update(mouse){
        if(this.mouse.leftDown && this.hover){
            this.beingDragged = true; // 
        }
    }

    toString(){
        return this.name + " is a " + this.type + " on port " + this.port.toString();
    }

    toPros(){
        throw new Error("Method not implemented.");
    }

    equals(device){
        return this.name === device.name && this.port === device.port && this.type === device.type && this.self === device.self;
    }
}

class V5Motor extends V5Device{
    reversed = false;
    wattage;
    port;
    rpm;
    
    /**
     * Constructs and initializes a new V5Motor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port number, 1-21; or port letter, A-H inclusive, or port pair, e.g. {{1, 'A'}}
     * @param {Boolean} _reversed Whether or not the motor is reversed
     * @param {number} _wattage How many watts the motor is (11W or 5.5W)
     * @param {number} _rpm How many RPM the motor goes at (what cartridge it is) (100, 200, 600)
     * @param {HTMLElement} _self Reference to the HTML element of the device
     * @param {Mouse} _mouse Mouse object
     */
    constructor(_name, _port, _reversed, _wattage, _rpm = 200, _self, _mouse){
        const type = _wattage.toString() + "W Motor";
        super(type, _name, _port, _x, _y, _canvas, _self, _mouse);
        this.reversed = _reversed;
        this.wattage = _wattage;
        this.rpm = _rpm;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", this.wattage.toString() + "W_Motor_" + this.rpm.toString() + ".png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::Motor " 
        + this.name + " (" 
        + this.port.toString() 
        + ", pros::E_MOTOR_GEARSET_" + this.rpm 
        + ", " + (this.reversed? "true" : "false")
        + ");\n";
    }
}

class V5MotorGroup{
    motors = [];
    name = "";
    type = "Motor Group";

    /**
     * Constructs and initializes a new V5MotorGroup
     * 
     * @param {Array<V5Motor>} _motors the motors in the group 
     */
    constructor(_motors){
        this.motors = _motors;
    }

    toString(){
        var str = this.name + " is a " + this.type + " consisting of:\n\t";
        for(var i = 0, motor; motor = this.motors[i]; i++){
            str += "-" + motor.toString() + "\n\t";
        }
        return str;
    }

    toPros(){
        var str = "";
        for(var i = 0, motor; motor = this.motors[i]; i++){
            str += motor.toPros();
        }
        str += "pros::MotorGroup " + this.name + "({";
        for(var i = 0, motor; motor = this.motors[i]; i++){
            str += motor.name + ", ";
        }
        str += "});\n";
        return str;
    }
}

class V5RotationSensor extends V5Device{
    reversed = false;
    type="Rotation Sensor";

    constructor(_name, _port, _reversed, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
        this.reversed = _reversed;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Rotation_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::RotationSensor "
        + this.name + " ("
        + this.port.toString()
        + ", " + (this.reversed? "true" : "false")
        + ");\n";
    }
}

class V5Imu extends V5Device{
    type="IMU";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "IMU.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::Imu "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5Piston extends V5Device{
    type="Piston";
    reversed = false;

    /**
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {Boolean} _reversed Whether or not to flip the default state of the piston
     * @param {HTMLElement} _self HTML element of the device
     * @param {Mouse} _mouse Mouse object
     */
    constructor(_name, _port, _reversed, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
        this.reversed = _reversed;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Piston.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::ADIDigitalOut "
        + this.name + " (\'"
        + this.port.toString()
        + "\', " + (this.reversed? "true" : "false")
        + ");\n";
    }
}

class V5OpticalSensor extends V5Device{
    type="Optical Sensor";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Optical_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::Optical "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5VisionSensor extends V5Device{
    type="Vision Sensor";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Vision_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::Vision "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5DistanceSensor extends V5Device{
    type="Distance Sensor";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Distance_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::Distance "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5GpsSensor extends V5Device{
    type="GPS Sensor";
    xOff;
    yOff;

    constructor(_name, _port, _xOff, _yOff, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
        this.xOff = _xOff;
        this.yOff = _yOff;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "GPS_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::Gps "
        + this.name + " ("
        + this.port.toString()
        + ", " + this.xOff.toString()
        + ", " + this.yOff.toString()
        + ");\n";
    }
}

class V5AdiExpander extends V5Device{
    #adiDevices = [V5Device];
    type="ADI Expander";

    /**
     * Constructs and initializes a new V5AdiExpander
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {Array<V5Device>} _devices Array of ADI Devices on this expander
     * @param {HTMLElement} _self HTML element of the device
     * @param {Mouse} _mouse Mouse object
     */
    constructor(_name, _port, _devices, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
        this.#adiDevices = _devices;
    }

    /**
     * @param {number} _port
     */
    set port(_port){
        super.port = _port;
        // Update the port of all the devices in the list
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            this.#updateDevicePort(adiDevice, _port);
        }
    }

    #updateDevicePort(_adiDevice, _port){
        // Get the lettered port
        var port = _adiDevice.port.split("\'")[1].trim();
        // Update the port pair
        _adiDevice.port = "{{" + _port.toString() + ", \'" + port + "\'}}";
    }

    addAdiDevice(_adiDevice){
        // See if any existing devices are on the same port
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            if(adiDevice.port === _adiDevice.port){
                // If so, throw an error
                throw new Error("Cannot add ADI Device " + _adiDevice.name + " to ADI Expander " + this.name + " because it is already on port " + _adiDevice.port.toString());
            }
        }
        // Otherwise, add it to the list
        this.#adiDevices.push(_adiDevice);
    }

    #sortList(){
        // Sort the list by port letter (ADI Devices have a letter instead of a number for port), A-H inclusive
        this.#adiDevices.sort(function(a, b){
            if(a.port < b.port){
                return -1;
            } else if(a.port > b.port){
                return 1;
            } else {
                return 0;
            }
        });
    }

    getAdiDevice(_adiDevice){
        // See if this device is in the list
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            if(adiDevice.equals(_adiDevice)){
                // If so, return it
                return adiDevice;
            }
        }
        // Otherwise, return null
        return null;
    }

    removeAdiDevice(_adiDevice){
        // See if this device is in the list
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            if(adiDevice.equals(_adiDevice)){
                // If so, remove it
                this.#adiDevices.splice(i, 1);
                return;
            }
        }
    }

    toString(){
        this.#sortList();
        var str = this.name + " is an ADI Expander consisting of:\n\t";
        for(var i = 0, adiDevice; adiDevice = this.adiDevices[i]; i++){
            str += "-" + adiDevice.toString() + "\n\t";
        }
        return str;
    }

    toPros(){
        this.#sortList();
        var str = "";
        for(var i = 0, adiDevice; adiDevice = this.adiDevices[i]; i++){
            this.#updateDevicePort(adiDevice, this.port);
            str += adiDevice.toPros();
        }
        return str;
    }
}

class V5AdiPot extends V5Device{
    type="ADI Potentiometer";
    version;

    /**
     * Constructs and initializes a new V5AdiPot
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {String} _version Which version of the potentiometer it is, either "V2" or "EDR"
     * @param {HTMLElement} _self HTML element of the device
     * @param {Mouse} _mouse Mouse object
     **/
    constructor(_name, _port, _version, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
        this.version = _version;
    }

    getImgUri(){
        // Make sure it is the correct version
        if(this.version === "V2"){
            const imgPath = path.join(context.extensionPath, "media", "ADI_Potentiometer_V2.png");
            return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
        } else if(this.version === "EDR"){
            const imgPath = path.join(context.extensionPath, "media", "ADI_Potentiometer_EDR.png");
            return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
        } else {
            throw new Error("Invalid ADI Potentiometer version: " + this.version);
        }
    }

    toPros(){
        return "pros::ADIPotentiometer "
        + this.name + " ("
        + this.port.toString()
        + ", pros::E_ADI_POT_" + this.version
        + ");\n";
    }
}

class V5AdiAnalogIn extends V5Device{
    type="ADI Analog In";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Analog_In.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::ADIAnalogIn "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5AdiDigitalIn extends V5Device{
    type="ADI Digital In";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Digital_In.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::ADIDigitalIn "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5AdiLineSensor extends V5Device{
    type="ADI Line Sensor";

    constructor(_name, _port, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Line_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::ADIAnalogIn"
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }
}

class V5AdiEncoder extends V5Device{
    type="ADI Encoder";
    reversed = false;

    constructor(_name, _port, _reversed, _self, _mouse){
        // Ensure that the port is an odd letter (A, C, E, G)
        if(_port.charAt(1) !== "A" && _port.charAt(1) !== "C" && _port.charAt(1) !== "E" && _port.charAt(1) !== "G"){
            throw new Error("Invalid ADI Encoder port: " + _port + ". Must be an odd letter (A, C, E, G)");
        }
        super(this.type, _name, _port, _self, _mouse);
        this.reversed = _reversed;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Encoder.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        // Check if in a port pair
        if(this.port.charAt(0) === "{"){
            // Get the port letter for top port
            var topPort = this.port.split("\'")[1].trim();
            // Lettered bottom port (one letter higher than port)
            var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
            // Get the numbered port from expander
            var portNum = this.port.split("{{")[0].substring(0,1); // Get just the number after the port pair
            // Generate port tuple (specific to this device)
            this.port = "{{" + portNum + ", \'" + topPort + "\' , \'" + bottomPort + "\'}}";

            return "pros::ADIAnalogIn"
            + this.name + " ("
            + this.port.toString()
            + ", " + (this.reversed? "true" : "false")
            + ");\n";
        }

        // Get the port letter for top port
        var topPort = this.port.split("\'")[1].trim();
        // Lettered bottom port (one letter higher than port)
        var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
        return "pros::ADIAnalogIn"
        + this.name + " (\'"
        + this.topPort.toString()
        + "\', \'" + bottomPort.toString() + "\', "
        + (this.reversed? "true" : "false")
        + ");\n";
    }
}

class V5AdiUs extends V5Device{
    type="ADI Ultrasonic";
    
    constructor(_name, _port, _self, _mouse){
        // Ensure that the port is an odd letter (A, C, E, G)
        if(_port.charAt(1) !== "A" && _port.charAt(1) !== "C" && _port.charAt(1) !== "E" && _port.charAt(1) !== "G"){
            throw new Error("Invalid ADI US Sensor port: " + _port + ". Must be an odd letter (A, C, E, G)");
        }
        super(this.type, _name, _port, _self, _mouse);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_US.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        // Check if in a port pair
        if(this.port.charAt(0) === "{"){
            // Get the port letter for top port
            var topPort = this.port.split("\'")[1].trim();
            // Lettered bottom port (one letter higher than port)
            var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
            // Get the numbered port from expander
            var portNum = this.port.split("{{")[0].substring(0,1); // Get just the number after the port pair
            // Generate port tuple (specific to this device)
            this.port = "{{" + portNum + ", \'" + topPort + "\' , \'" + bottomPort + "\'}}";

            return "pros::ADIUltrasonic"
            + this.name + " ("
            + this.port.toString()
            + ");\n";
        }

        // Get the port letter for top port
        var topPort = this.port.split("\'")[1].trim();
        // Lettered bottom port (one letter higher than port)
        var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
        return "pros::ADIUltrasonic"
        + this.name + " (\'"
        + this.topPort.toString()
        + "\', \'" + bottomPort.toString() + "\');\n";
    }
}

class V5AdiLed extends V5Device{
    type="ADI LED";
    length;
    
    constructor(_name, _port, _length, _self, _mouse){
        super(this.type, _name, _port, _self, _mouse);
        this.length = _length;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_LED.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "pros::ADILed "
        + this.name + " ("
        + this.port.toString()
        + ", " + this.length.toString()
        + ");\n";
    }
}



class V5Port{
    port;
    device = null;
    x;
    y;

    /**
     * Constructs and initializes a new V5Port
     * 
     * @param {Number | String} _port Integer port number, 1-21; or port letter, A-H inclusive, or port pair, e.g. {{1, 'A'}}
     **/
    constructor(_port){
        this.port = _port;
    }

    /**
     * @param {V5Device} _device
     */
    set device(_device){
        this.device = _device;
    }

    toString(){
        if(this.device === null){
            return "Port " + this.port.toString() + " is empty.\n";
        }
        return "Port " + this.port.toString() + " contains: " + this.device.toString().replace("is a", "which is a"); // Replace "is a" with "which is a" to make it more readable
    }
    toPros(){
        if(this.device === null){
            return "";
        }
        return this.device.toPros();
    }
}


class V5Robot{
    ports = [];

    /**
     * Constructs and initializes a new V5Robot
     **/
    constructor(){
        for(var i = 0; i < 21; i++){
            this.ports.push(new V5Port(i+1));
        }
    }

    toPros(){
        var str = `
        /**
         * THIS FILE WAS GENERATED BY THE PROS VSCODE EXTENSION'S ROBOT CONFIGURATOR
         * IT CONTAINS PORT CONFIGURATIONS
         **/
        
        `;
        for(var i = 0, port; port = this.ports[i]; i++){
            str += port.toPros();
        }
        return str;
    }
}

// HTML elements for adding generic listeners
const deviceTable = document.getElementById("device-table");
const portTable = document.getElementById("ports-table");
const deviceRows = document.getElementsByClassName("device-row");
const deviceCols = document.getElementsByClassName("device-col");
const portRows = document.getElementsByClassName("port-row");
const portCols = document.getElementsByClassName("port-col");
const debug = document.getElementById("debug");

// HTML elements for adding specific listeners, initializing v5Devices
const MOTOR_BIG = document.getElementById("11W MOTOR");
const MOTOR_SMALL = document.getElementById("5.5W MOTOR");
const MOTOR_GROUP = document.getElementById("MOTOR GROUP");
const ROTATION_SENSOR = document.getElementById("ROTATION SENSOR");
const IMU = document.getElementById("IMU");
const PISTON = document.getElementById("PISTON");
const OPTICAL_SENSOR = document.getElementById("OPTICAL SENSOR");
const VISION_SENSOR = document.getElementById("VISION SENSOR");
const DISTANCE_SENSOR = document.getElementById("DISTANCE SENSOR");
const GPS_SENSOR = document.getElementById("GPS SENSOR");
const ADI_EXPANDER = document.getElementById("ADI EXPANDER");
const ADI_POT = document.getElementById("ADI POT");
const ADI_ANALOG_IN = document.getElementById("ADI ANALOG IN");
const ADI_DIGITAL_IN = document.getElementById("ADI DIGITAL IN");
const ADI_LINE_SENSOR = document.getElementById("ADI LINE SENSOR");
const ADI_ENCODER = document.getElementById("ADI ENCODER");
const ADI_US = document.getElementById("ADI ULTRASONIC");
const ADI_LED = document.getElementById("ADI LED");



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