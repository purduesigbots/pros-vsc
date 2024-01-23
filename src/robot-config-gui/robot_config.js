/**
 * 
 * V5 DEVICE PARENT CLASS
 * 
 */
class V5Device{
    type;
    name;
    port;
    self; // the html element of the device
    selected = false;

    /**
     * Constructs and initializes a new V5Device
     * 
     * @param {String} _type Device type name e.g. "Rotation Sensor"
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {number | String} _port Integer port number, 1-21, or port letter, A-H inclusive (INCLUDE THE QUOTES, e.g. 'A')
     * @param {HTMLElement} _self HTML element of the device
     */
    constructor(_type, _name, _port, _self){
        if(this.constructor === V5Device){
             throw new Error("Cannot instantiate abstract class V5Device");
        }
        this.type = _type;
        this.name = _name;
        this.port = _port;
        this.self = _self;
    }

    /**
     * Returns a vscode URI to the image of the device
     *
     * @param {import("vscode").ExtensionContext} context The extension context
     * @returns {vscode.Uri} URI to the image of the device
     */
    getImgUri(context){
        throw new Error("Method not implemented.");
    }

    /**
     * Gets a verbose description of the device
     * 
     * @returns {String} Verbose description of the device
     */
    toString(){
        return this.name + " is a " + this.type + " on port " + this.port.toString();
    }

    /**
     * Gets the pros code for the device
     * 
     * @returns {String} The pros code for the device
     */
    toPros(){
        throw new Error("Method not implemented.");
    }

    /**
     * Checks if two devices are the identical
     * 
     * @param {V5Device} device the device to compare against
     * @returns {Boolean} Whether or not the devices are equal
     */
    equals(device){
        return this.name === device.name && this.port === device.port && this.type === device.type && this.self === device.self;
    }

    /**
     * Creates a new V5Device with all instance data copied
     * 
     * @returns {V5Device} The new device
     */
    #clone(){
        throw new Error("Method not implemented.");
    }

    /**
     * Creates a copy of the demo object in an actual port
     * 
     * @param {number | String} _port Port of the device to be copied into existence on the actual robot
     * @returns {V5Device} The new device
     */
    generate(_port){
        var newDevice = this.#clone();
        newDevice.port = _port();
        return newDevice;
    }
}

/**
 * 
 * V5 DEVICE CLASSES
 * 
 */
class V5Motor extends V5Device{
    reversed = false;
    wattage;
    rpm;
    
    /**
     * Constructs and initializes a new V5Motor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {Boolean} _reversed Whether or not the motor is reversed
     * @param {number} _wattage How many watts the motor is (11W or 5.5W)
     * @param {number} _rpm How many RPM the motor goes at (what cartridge it is) (100, 200, 600)
     * @param {HTMLElement} _self Reference to the HTML element of the device
     */
    constructor(_name, _port, _reversed, _wattage, _rpm = 200, _self){
        const type = _wattage.toString() + "W Motor";
        super(type, _name, _port, _self);
        this.reversed = _reversed;
        this.wattage = _wattage;
        this.rpm = _rpm;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", this.wattage.toString() + "W_Motor_" + this.rpm.toString() + ".png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::Motor " 
        + this.name + " (" 
        + this.port.toString() 
        + ", pros::E_MOTOR_GEARSET_" + this.rpm 
        + ", " + (this.reversed? "true" : "false")
        + ");\n";
    }

    #clone(){
        return new V5Motor(this.name, this.port, this.reversed, this.wattage, this.rpm, this.self);
    }

    generate(_port){
        var newMotor = this.#clone();
        newMotor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newMotor.type;
        this.reversed = false;
        this.wattage = 11;
        this.rpm = 200;
        return newMotor;
    }

    toString(){
        return super.toString() + " with " + this.wattage.toString() + "W at " + this.rpm.toString() + " RPM";
    }
    
    
}

class V5MotorGroup extends V5Device{
    motors = [];

    /**
     * Constructs and initializes a new V5MotorGroup
     *
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {Array<V5Motor>} _motors the motors in the group
     * @param {HTMLElement} _self HTML element of the device
     */
    constructor(_name, _port, _motors, _self){
        super("Motor Group", _name, null, _self);
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
            str += motor.toPros().remove("extern ");
        }
        str += "extern pros::MotorGroup " + this.name + "({";
        for(var i = 0, motor; motor = this.motors[i]; i++){
            str += motor.name + ", ";
        }
        str += "});\n";
        return str;
    }

    addMotor(_motor){
        // Check for duplicate motors
        for(var i = 0, motor; motor = this.motors[i]; i++){
            if(motor.equals(_motor)){
                throw new Error("Cannot add motor " + _motor.name + " to motor group " + this.name + " because it is already in the group");
            }
        }
        this.motors.push(_motor);
    }

    removeMotor(_motor){
        for(var i = 0, motor; motor = this.motors[i]; i++){
            if(motor.equals(_motor)){
                this.motors.splice(i, 1);
                return;
            }
        }
    }

}

class V5RotationSensor extends V5Device{
    reversed = false;

    /**
     * Constructs and initializes a new V5RotationSensor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {Boolean} _reversed Whether or not the sensor is reversed
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _reversed, _self){
        super("Rotation Sensor", _name, _port, _self);
        this.reversed = _reversed;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Rotation_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::RotationSensor "
        + this.name + " ("
        + this.port.toString()
        + ", " + (this.reversed? "true" : "false")
        + ");\n";
    }

    #clone(){
        return new V5RotationSensor(this.name, this.port, this.reversed, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newSensor.type;
        this.reversed = false;
        return newSensor;
    }
}

class V5Imu extends V5Device{

    /**
     * Constructs and initializes a new V5Imu
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("IMU", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "IMU.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::Imu "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5Imu(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5Piston extends V5Device{
    reversed = false;

    /**
     * Constructs and initializes a new V5Piston
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {Boolean} _reversed Whether or not to flip the default state of the piston
     * @param {HTMLElement} _self HTML element of the device
     */
    constructor(_name, _port, _reversed, _self){
        super("Piston", _name, _port, _self);
        this.reversed = _reversed;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Piston.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::ADIDigitalOut "
        + this.name + " (\'"
        + this.port.toString()
        + "\', " + (this.reversed? "true" : "false")
        + ");\n";
    }

    #clone(){
        return new V5Piston(this.name, this.port, this.reversed, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        this.reversed = false;
        return newSensor;
    }
}

class V5OpticalSensor extends V5Device{

    /**
     * Constructs and initializes a new V5OpticalSensor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("Optical Sensor", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Optical_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::Optical "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5OpticalSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5VisionSensor extends V5Device{
    type="Vision Sensor";

    /**
     * Constructs and initializes a new V5VisionSensor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("Vision Sensor", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Vision_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::Vision "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5VisionSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5DistanceSensor extends V5Device{

    /**
     * Constructs and initializes a new V5DistanceSensor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("Distance Sensor", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "Distance_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::Distance "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5DistanceSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5GpsSensor extends V5Device{
    xOff;
    yOff;

    /**
     * Constructs and initializes a new V5GpsSensor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {Number} _xOff X offset from center of robot
     * @param {Number} _yOff Y offset from center of robot
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _xOff, _yOff, _self){
        super("GPS Sensor", _name, _port, _self);
        this.xOff = _xOff;
        this.yOff = _yOff;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "GPS_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::Gps "
        + this.name + " ("
        + this.port.toString()
        + ", " + this.xOff.toString()
        + ", " + this.yOff.toString()
        + ");\n";
    }

    #clone(){
        return new V5GpsSensor(this.name, this.port, this.xOff, this.yOff, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = -1;
        this.name = newSensor.type;
        this.xOff = 0;
        this.yOff = 0;
        return newSensor;
    }
}

class V5AdiExpander extends V5Device{
    #adiDevices = [V5Device];

    /**
     * Constructs and initializes a new V5AdiExpander
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {Number} _port Device port number, 1-21
     * @param {Array<V5Device>} _devices Array of ADI Devices on this expander
     * @param {HTMLElement} _self HTML element of the device
     */
    constructor(_name, _port, _devices, _self){
        super("ADI Expander", _name, _port, _self);
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
    version;

    /**
     * Constructs and initializes a new V5AdiPot
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {String} _version Which version of the potentiometer it is, either "V2" or "EDR"
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _version, _self){
        super("ADI Potentiometer", _name, _port, _self);
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
        return "extern pros::ADIPotentiometer "
        + this.name + " ("
        + this.port.toString()
        + ", pros::E_ADI_POT_" + this.version
        + ");\n";
    }

    #clone(){
        return new V5AdiPot(this.name, this.port, this.version, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5AdiAnalogIn extends V5Device{

    /**
     * Constructs and initializes a new V5AdiAnalogIn
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("ADI Analog In", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Analog_In.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::ADIAnalogIn "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiAnalogIn(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5AdiDigitalIn extends V5Device{

    /**
     * Constructs and initializes a new V5AdiDigitalIn
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("ADI Digital In", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Digital_In.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::ADIDigitalIn "
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiDigitalIn(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5AdiLineSensor extends V5Device{

    /**
     * Constructs and initializes a new V5AdiLineSensor
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self){
        super("ADI Line Sensor", _name, _port, _self);
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Line_Sensor.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::ADIAnalogIn"
        + this.name + " ("
        + this.port.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiLineSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5AdiEncoder extends V5Device{
    reversed = false;

    /**
     * Constructs and initializes a new V5AdiEncoder
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'. Must be an odd letter (A, C, E, G)
     * @param {Boolean} _reversed Whether or not the encoder is reversed
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _reversed, _self){
        //Check if port pair
        var topPort;
        if(_port.charAt(0) === "{"){
            // Get the port letter for top port
            topPort = _port.split("\'")[1].trim();
        } else {
            topPort = _port;
        }
        // Ensure that the top port is an odd letter (A, C, E, G)
        if(topPort.charAt(0) !== 'A' && topPort.charAt(0) !== 'C' && topPort.charAt(0) !== 'E' && topPort.charAt(0) !== 'G'){
            throw new Error("Invalid ADI Encoder port letter: " + topPort + ". Must be an odd letter (A, C, E, G)");
        }
        super("ADI Encoder", _name, _port, _self);
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

            return "extern pros::ADIAnalogIn"
            + this.name + " ("
            + this.port.toString()
            + ", " + (this.reversed? "true" : "false")
            + ");\n";
        }

        // Get the port letter for top port
        var topPort = this.port.split("\'")[1].trim();
        // Lettered bottom port (one letter higher than port)
        var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
        return "extern pros::ADIAnalogIn"
        + this.name + " (\'"
        + this.topPort.toString()
        + "\', \'" + bottomPort.toString() + "\', "
        + (this.reversed? "true" : "false")
        + ");\n";
    }

    #clone(){
        return new V5AdiEncoder(this.name, this.port, this.reversed, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        this.reversed = false;
        return newSensor;
    }
}

class V5AdiUs extends V5Device{
    
    /**
     * Constructs and initializes a new V5AdiUs
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'. Must be an odd letter (A, C, E, G)
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _self, _mouse){
        //Check if port pair
        var adiPort;
        if(_port.charAt(0) === "{"){
            // Get the port letter for top port
            adiPort = _port.split("\'")[1].trim();
        } else {
            adiPort = _port;
        }
        // Ensure that the top port is an odd letter (A, C, E, G)
        if(adiPort.charAt(0) !== 'A' && adiPort.charAt(0) !== 'C' && adiPort.charAt(0) !== 'E' && adiPort.charAt(0) !== 'G'){
            throw new Error("Invalid ADI Encoder port letter: " + adiPort + ". Must be an odd letter (A, C, E, G)");
        }
        super("ADI Ultrasonic", _name, _port, _self);
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

            return "extern pros::ADIUltrasonic"
            + this.name + " ("
            + this.port.toString()
            + ");\n";
        }

        // Get the port letter for top port
        var topPort = this.port.split("\'")[1].trim();
        // Lettered bottom port (one letter higher than port)
        var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
        return "extern pros::ADIUltrasonic"
        + this.name + " (\'"
        + this.topPort.toString()
        + "\', \'" + bottomPort.toString() + "\');\n";
    }

    #clone(){
        return new V5AdiUs(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        return newSensor;
    }
}

class V5AdiLed extends V5Device{
    length;
    
    /**
     * Constructs and initializes a new V5AdiLed
     * 
     * @param {String} _name Device name e.g. "liftSensor" to be used in pros project code
     * @param {String} _port Device port letter, A-H inclusive. INCLUDE THE QUOTES, e.g. 'A'
     * @param {Number} _length Length of the LED strip in LEDs
     * @param {HTMLElement} _self HTML element of the device
     **/
    constructor(_name, _port, _length, _self){
        super("ADI LED", _name, _port, _self);
        this.length = _length;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_LED.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        return "extern pros::ADILed "
        + this.name + " ("
        + this.port.toString()
        + ", " + this.length.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiLed(this.name, this.port, this.length, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.port = '{-1, \'A\'}';
        this.name = newSensor.type;
        this.length = 1;
        return newSensor;
    }
}

/**
 * 
 * V5 PORT CLASS
 * 
 */
class V5Port{
    port;
    device = null;
    x;
    y;
    self;
    isAdi = false;

    /**
     * Constructs and initializes a new V5Port
     * 
     * @param {Number | String} _port Integer port number, 1-21; or port letter, A-H inclusive, or port pair, e.g. {{1, 'A'}}
     * @param {HTMLElement} _self HTML element of the port
     **/
    constructor(_port, _self){
        // Validate inputted port
        if(typeof _port === "string"){
            this.isAdi = true;
            // If port pair, get both smart port number and ADI port letter
            if(_port.charAt(0) === "{"){
                var smartPort = parseInt(_port.split("{{")[1].split(",")[0].trim());
                var adiPort = _port.split("\'")[1].charAt(0);
            } else{
                // Not a port pair, get only ADI port letter
                var adiPort = _port.charAt(0);
            }
            // Ensure that the ADI port letter is valid (A-H inclusive)
            if(adiPort.charCodeAt(0) < 65 || adiPort.charCodeAt(0) > 72){
                throw new Error("Invalid ADI port letter: " + adiPort + ". Must be a letter between A and H inclusive");
            }
        } else{
            // Otherwise _port = smart port number
            var smartPort = _port;
        }
        // Ensure that the smart port number is valid (1-21 inclusive)
        if(smartPort < 1 || smartPort > 21){
            throw new Error("Invalid port number: " + smartPort + ". Must be between 1 and 21 inclusive");
        }
        this.port = _port;
        this.self = _self;
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

/**
 * 
 * V5 ROBOT CLASS
 * 
 */
class V5Robot{
    ports = [V5Device];

    /**
     * Constructs and initializes a new V5Robot
     **/
    constructor(){
        for(var i = 0, port; port = this.ports[i]; i++){
            port = new V5Port(i+1);
        }
    }

    /**
     * Adds a motor group to the robot
     *
     * @param {V5MotorGroup} motorGroup the motor group to add
     */
    addMotorGroup(motorGroup){
        this.ports.push(motorGroup);
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

/**
 * 
 * HELPER FUNCTIONS
 * 
 */

/**
 * Updates the port elements on page
 */
function updatePorts(){
    for(var i = 0, port; port = ports[i]; i++){
        // Check if this port has a device
        if(port.device === null){
            // If not, set the image to empty
            //port.self.src = "media/Empty_Port.png";
            port.self.innerHTML = 
            `
            <h2>Port ${(i+1).toString()}</h2>
            `;
        } else {
            // If so, set the image to the device's image
            //port.self.src = port.device.getImgUri();
            port.self.innerHTML = 
            `
            <h2>Port ${(i+1).toString()}</h2>
            <body>${port.device.name}</body>
            `;
        }
    }
}

/**
 * Updates the options section of the page when a device is selected (from device table or any port)
 * 
 * @param {HTMLElement} optionsElem The HTML Parent Element of all options input elements
 */
function updateOptions(optionsElem){
    // Check if a device is selected (from device table or any port)
    var selected = false;
    var device = null;
    for(port of ports){
        // Since we evaluate nullity first, we can safely call port.device.selected on the right side of the && operator (thanks Prof. Crum)
        if(port.device !== null && port.device.selected){
            selected = true;
            device = port.device;
            break;
        }
    }
    for(dev of devices){
        if(dev.selected){
            selected = true;
            device = dev;
            break;
        }
    }

    // If not, display default options message
    if(!selected){
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <p id="Options-Body">
        Select a device from the table above or an already configured device below to configure its options.
        </p>
        `;
        return;
    }

    // If so, display the options for that device
     /**
     * Unique: Motor (11W), Motor Group, GPS, ADI Led, 
     * Name, Reversed: Motor (5.5W), Rotation Sensor, Piston, ADI Pot, ADI Encoder
     * Name: IMU, Optical Sensor, Vision Sensor, Distance Sensor, ADI Analog In, ADI Digital In, ADI Line Sensor, ADI Ultrasonic
     */
    if(device.type === "11W Motor"){
        // Parameters present: name, reversed, gearset
        let reversed = device.reversed? "checked" : "";
        // Generate (ordered) gearset options
        var firstGearset;
        var secondGearset;
        var thirdGearset;
        switch(device.rpm){
            case 100:
                firstGearset = "100 (Red)";
                secondGearset = "200 (Green)";
                thirdGearset = "600 (Blue)";
                break;
            case 200:
                firstGearset = "200 (Green)";
                secondGearset = "100 (Red)";
                thirdGearset = "600 (Blue)";
                break;
            case 600:
                firstGearset = "600 (Blue)";
                secondGearset = "100 (Red)";
                thirdGearset = "200 (Green)";
                break;
            default:
                throw new Error("Invalid gearset: " + device.rpm + "When generating options for the following device: " + device.toString());
        }
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}">
        </input>
        <input type="checkbox" id="Option_Reversed" ${reversed}>
        <label for="Option_Reversed">Reversed</label>
        </input>
        <select name="Option_Gearset" id="Option_Gearset">
            <label for="Option_Gearset">Gearset</label>
            <option value="${firstGearset.split(' ')[0]}">${firstGearset}</option>
            <option value="${secondGearset.split(' ')[0]}">${secondGearset}</option>
            <option value="${thirdGearset.split(' ')[0]}">${thirdGearset}</option>
        </select>
        `;

        // Add 11W Motor Unique Event Listeners
        let gearsetSelect = optionsElem.querySelector("#Option_Gearset");
        gearsetSelect.addEventListener("change", function(){
            switch(gearsetSelect.value){
                case "100":
                    device.rpm = 100;
                    break;
                case "200":
                    device.rpm = 200;
                    break;
                case "600":
                    device.rpm = 600;
                    break;
                default:
                    throw new Error("Invalid gearset: " + gearsetSelect.value + "When generating options for the following device: " + device.toString());
            }
        });
    } else if(device.type === "5.5W Motor" || device.type === "ADI Pot" || device.type === "ADI Encoder" || device.type === "Rotation Sensor" || device.type === "Piston"){
        // Parameters present: name, reversed
        let reversed = device.reversed? "checked" : "";
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}">
        </input>
        <input type="checkbox" id="Option_Reversed" ${reversed}>
            <label for="Option_Reversed">Reversed</label>
        </input>
        `;
    } else if(device.type === "Motor Group"){
        throw new Error("Motor Group options not yet implemented");
    } else if(device.type === "IMU" || device.type === "Optical Sensor" || device.type === "Vision Sensor" || device.type === "Distance Sensor" || device.type === "ADI Analog In" || device.type === "ADI Digital In" || device.type === "ADI Line Sensor" || device.type === "ADI Ultrasonic"){
        // Parameters present: name
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}"
            <label for="Option_Name">Device Name</label>
        </input>
        `;
    } else if(device.type === "GPS Sensor"){
        // Parameters present: name, x offset, y offset
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}"
            <label for="Option_Name">Device Name</label>
        </input>
        <input type="number" id="Option_X" placeholder="${device.xOff}"
            <label for="Option_X">X Offset</label>
        </input>
        <input type="number" id="Option_Y" placeholder="${device.yOff}"
            <label for="Option_Y">Y Offset</label>
        </input>
        `;

        // Add GPS Sensor Unique Event Listeners
        let xInput = optionsElem.querySelector("#Option_X");
        xInput.addEventListener("input", function(){
            device.xOff = xInput.value;
        });
        let yInput = optionsElem.querySelector("#Option_Y");
        yInput.addEventListener("input", function(){
            device.yOff = yInput.value;
        });
    } else if(device.type === "ADI Expander"){
        throw new Error("ADI Expander options not yet implemented");
    } else if(device.type === "ADI Led"){
        // Parameters present: name, length
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}"
            <label for="Option_Name">Device Name</label>
        </input>
        <input type="number" id="Option_Length" placeholder="${device.length}"
            <label for="Option_Length">Length</label>
        </input>
        `;

        // Add ADI Led Unique Event Listeners
        let lengthInput = optionsElem.querySelector("#Option_Length");
        lengthInput.addEventListener("input", function(){
            device.length = lengthInput.value;
        });
    } else {
        throw new Error("Invalid device type: " + device.type);
    }
    
    // Add event listeners to parameters shared by all devices (name):
    var nameInput = optionsElem.querySelector("#Option_Name");
    nameInput.addEventListener("input", function(){
        device.name = nameInput.value;
    });

    // Add event listeners to parameters shared by some devices (reversed) if applicable to selected device:
    if(device.type === "11W Motor" || device.type === "5.5W Motor" || device.type === "ADI Pot" || device.type === "ADI Encoder" || device.type === "Rotation Sensor" || device.type === "Piston"){
        let reversedInput = optionsElem.querySelector("#Option_Reversed");
        reversedInput.addEventListener("change", function(){
            device.reversed = reversedInput.checked;
        });
    }
}

/**
 * Deselects all devices and ports
 */
function deselectAll(){
    for(var i = 0, device; device = devices[i]; i++){
        device.selected = false;
        device.self.style.border = "1px transparent";
    }
    for(var i = 0, port; port = ports[i]; i++){
        // Check if port has a device (not null)
        if(port.device !== null){
            port.device.selected = false;
            port.device.self.style.border = "1px transparent";
        }
    }

}

/**
 * Selects a V5Device. Deselects if already selected. Deselects all others if selecting this device.
 * 
 * @param {V5Device} device the device to select
 */
function select(device){
    //Check if already selected
    if(device.selected){
        //if so, deselect
        device.selected = false;
        device.self.style.border = "1px transparent";
        return;
    }
    //Else, select this device and deselect all others
    deselectAll();
    device.selected = true;
    device.self.style.border = "1px solid red";
}

/**
 * 
 * GLOBAL DATA
 * 
 */

//Both of these are filled in window.onload
var ports = []; // Array of V5Port objects (ports 1-21 (which are indexes 0-20) followed by ADI ports A-H (which are indexes 21-28))
var devices = []; // Array of demo V5 Device Objects (see V5Device class)

//This initializes everything and adds all event listeners 3
// (except options stuff which is handled in the updateOptions(optionsElem) function above)
window.onload = setTimeout(function(){
    // HTML elements for adding generic listeners
    const deviceTable = document.getElementById("device-table");
    const portTable = document.getElementById("ports-table");
    const deviceRows = document.getElementsByClassName("device-row");
    const deviceCols = document.getElementsByClassName("device-col");
    const portRows = document.getElementsByClassName("port-row");
    const portCols = document.getElementsByClassName("port-col");

    const debug = document.getElementById("debug");
    const optionsBody = document.getElementById("Options-Body");
    const options = document.getElementById("Options");

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

    devices.push(new V5Motor("11W MOTOR", -1, false, 11, 200, MOTOR_BIG));
    devices.push(new V5Motor("5.5W MOTOR", -1, false, 5.5, 200, MOTOR_SMALL));
    devices.push(new V5MotorGroup("MOTOR GROUP", -1, false, null, null, MOTOR_GROUP));
    devices.push(new V5RotationSensor("ROTATION SENSOR", 4, false, ROTATION_SENSOR));
    devices.push(new V5Imu("IMU", -1, IMU));
    devices.push(new V5Piston("PISTON", '{-1, \'A\'}', false, PISTON));
    devices.push(new V5OpticalSensor("OPTICAL SENSOR", -1, OPTICAL_SENSOR));
    devices.push(new V5VisionSensor("VISION SENSOR", -1, VISION_SENSOR));
    devices.push(new V5DistanceSensor("DISTANCE SENSOR", -1, DISTANCE_SENSOR));
    devices.push(new V5GpsSensor("GPS SENSOR", -1, 0, 0, GPS_SENSOR));
    devices.push(new V5AdiExpander("ADI EXPANDER", -1, ADI_EXPANDER));
    devices.push(new V5AdiPot("ADI POT", '{-1, \'A\'}', "V2", ADI_POT));
    devices.push(new V5AdiAnalogIn("ADI ANALOG IN", '{-1, \'A\'}', ADI_ANALOG_IN));
    devices.push(new V5AdiDigitalIn("ADI DIGITAL IN", '{-1, \'A\'}', ADI_DIGITAL_IN));
    devices.push(new V5AdiLineSensor("ADI LINE SENSOR", '{-1, \'A\'}', ADI_LINE_SENSOR));
    devices.push(new V5AdiEncoder("ADI ENCODER", '{-1, \'A\'}', false, ADI_ENCODER));
    devices.push(new V5AdiUs("ADI ULTRASONIC", '{-1, \'A\'}', ADI_US));
    devices.push(new V5AdiLed("ADI LED", '{-1, \'A\'}', 1, ADI_LED));

    //Add event listeners to each device entry
    for(var i = 0; i < deviceRows.length; i++){
        
        var row = deviceRows[i];
        for(var j = 0; j < 6; j++){
            var id = (i*6) + j;
            var col = deviceCols[id]; 
            devices[id].self = col;
            col.setAttribute("id", "device-" + id);
            col.onclick = function(){
                var myID = parseInt(this.id.split("-")[1]);
                select(devices[myID]);
                updateOptions(options);
            };
            col.onmouseover = function(){
                var myID = parseInt(this.id.split("-")[1]);
                if(!devices[myID].selected){
                    this.style.border = "1px solid blue";
                } 
            };
            col.onmouseout = function(){
                var myID = parseInt(this.id.split("-")[1]);
                if(!devices[myID].selected){
                    this.style.border = "1px transparent";
                }
            };
        }
    }

    //Add event listeners to each port entry
    console.log("Port Rows Info: " + portRows.length.toString() + " " + portCols.length.toString());
    for(var i = 0; i < portCols.length; i++){
        var col = portCols[i];
        col.setAttribute("id", "port-" + (i + 1));
        // Add port to ports array
        if(i < 21){
            // Push smart port 
            ports.push(new V5Port(i + 1, col));
        } else{
            // Push ADI port with just port letter
            ports.push(new V5Port(String.fromCharCode(i - 21 + 65), col));
        }
        col.onclick = function(){
            // See if there is a device selected (triggers device generation)
            for(var k = 0; k < devices.length; k++){
                if(devices[k].selected){
                    // If so, generate such a device for this port
                    // Check if port type is correct
                    var myID = parseInt(this.id.split("-")[1]);
                    let port = ports[myID].port;
                    if((port.isAdi && devices[k].type.includes("ADI")) || (!port.isAdi && !devices[k].type.includes("ADI"))){
                        // Deselect the device (unless it is the motor group device)
                        if(devices[k].type !== "Motor Group"){
                            deselectAll();
                        }
                        console.log(" Adding device " + devices[k].name + " to port " + myID.toString());
                        var device = devices[k].generate(myID);
                        device.self = this;
                        console.log("  Generated device: " + device.toString());
                        ports[myID - 1].device = device;
                        // Select this new device if not a part of a motor group
                        if(device.type !== "Motor Group"){
                            select(device);
                            // Update options to reflect this device
                            updateOptions(options);
                        }
                        updatePorts();
                        return;
                    } else{
                        // Mismatched port type + device type
                        throw new Error("Mismatched port type and device type: " + port.isAdi.toString() + " " + devices[k].type.includes("ADI").toString());
                        return;
                    }
                }
            }
            var myId = parseInt(this.id.split("-")[1]);
            var port = ports[myId - 1];
            // If not, see if there is a device in this port (configure existing device)
            if(port.device !== null){
                // If so, select the port
                select(port.device);
            } else{
                // Empty port was clicked, deselect all
                deselectAll();
            }
            updateOptions(options);
            updatePorts();
        };
        col.onmouseover = function(){
            var myID = parseInt(this.id.split("-")[1]);
            // Ensure this port is not selected
            if(ports[myID - 1].device !== null && !ports[myID - 1].device.selected){
                this.style.border = "1px solid blue";
            } else if(ports[myID - 1].device === null){
                this.style.border = "1px solid blue";
            }

            // Don't make blue if this port is a mismatched type for generation
            // See if there is a device selected (triggers device generation)
            for(var k = 0; k < devices.length; k++){
                if(devices[k].selected){
                    // Check if port type is correct
                    var myID = parseInt(this.id.split("-")[1]);
                    let port = ports[myID].port;
                    if((port.isAdi && devices[k].type.includes("ADI")) || (!port.isAdi && !devices[k].type.includes("ADI"))){
                        this.style.border = "1px transparent";
                        return;
                    } else{
                        // Mismatched port type + device type
                        return;
                    }
                }
            }
        };
        col.onmouseout = function(){
            var myID = parseInt(this.id.split("-")[1]);
            // Ensure this port is not selected
            if(ports[myID - 1].device !== null && !ports[myID - 1].device.selected){
                this.style.border = "1px transparent";
            } else if(ports[myID - 1].device === null){
                this.style.border = "1px transparent";
            }
        };
    }
    updatePorts();
});
