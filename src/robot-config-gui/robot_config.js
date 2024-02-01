/**
 * 
 * V5 DEVICE PARENT CLASS
 * 
 */
class V5Device{
    type;
    name;
    portProtected;
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
        this.portProtected = _port;
        this.self = _self;
    }

    get port(){
        return this.portProtected;
    }

    set port(_port){
        this.portProtected = _port;
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
        return this.name + " is a " + this.type + " on port " + this.portProtected.toString();
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
        return this.name === device.name && this.portProtected=== device.port && this.type === device.type && this.self === device.self;
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
        + this.portProtected.toString() 
        + ", pros::E_MOTOR_GEARSET_" + this.rpm 
        + ", " + (this.reversed? "true" : "false")
        + ");\n";
    }

    #clone(){
        return new V5Motor(this.name, this.portProtected, this.reversed, this.wattage, this.rpm, this.self);
    }

    generate(_port){
        var newMotor = this.#clone();
        newMotor.port = _port;
        // Reset demo object
        this.portProtected= -1;
        this.name = newMotor.type;
        this.reversed = false;
        this.wattage = newMotor.wattage;
        this.rpm = 200;
        return newMotor;
    }

    toString(){
        return super.toString() + " with " + this.wattage.toString() + "W at " + this.rpm.toString() + " RPM";
    }
    
    
}

class V5MotorGroup extends V5Device{
    #motors = [V5Motor];
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
        this.#motors = _motors;
    }

    /**
     * @param {Array<V5Motor>} _motors the motors to set the motor group to contain
     */
    set motors(_motors){
        this.#motors = _motors;
        this.#sortList();
    }

    /**
     * @returns {Array<V5Motor>} the motors in the motor group
     */
    get motors(){
        return this.#motors;
    }

    size(){
        return this.#motors.length;
    }

    toString(){
        var str = this.name + " is a " + this.type + " consisting of:\n\t";
        for(var i = 0, motor; motor = this.#motors[i]; i++){
            str += "-" + motor.toString() + "\n\t";
        }
        return str;
    }

    toPros(){
        var str = "";
        for(var i = 0, motor; motor = this.#motors[i]; i++){
            str += motor.toPros().remove("extern ");
        }
        str += "extern pros::MotorGroup " + this.#motors + "({";
        for(var i = 0, motor; motor = this.#motors[i]; i++){
            str += motor.name + ", ";
        }
        str += "});\n";
        return str;
    }

    addMotor(_motor){
        // Check for duplicate motors
        for(var i = 0, motor; motor = this.#motors[i]; i++){
            if(motor.equals(_motor)){
                throw new Error("Cannot add motor " + _motor.name + " to motor group " + this.name + " because it is already in the group");
            }
        }
        this.#motors.push(_motor);
    }

    removeMotor(_motor){
        for(var i = 0, motor; motor = this.#motors[i]; i++){
            if(motor.equals(_motor)){
                this.#motors.splice(i, 1);
                return;
            }
        }
    }

    contains(_motor){
        for(var i = 0, motor; motor = this.#motors[i]; i++){
            if(motor.equals(_motor)){
                return true;
            }
        }
        return false;
    }

    #sortList(){
        // Sort list by ascending port number
        if(this.numMotors() !== 0){
            this.#motors.sort(function(a, b){
                if(a.port < b.port){
                    return -1;
                } else if(a.port > b.port){
                    return 1;
                } else {
                    return 0;
                }
            });
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
        + this.portProtected.toString()
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
        this.portProtected= -1;
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5Imu(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= -1;
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
        + this.portProtected.toString()
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
        this.portProtected= '{-1, \'A\'}';
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5OpticalSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= -1;
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5VisionSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= -1;
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5DistanceSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= -1;
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
        + this.portProtected.toString()
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
        this.portProtected= -1;
        this.name = newSensor.type;
        this.xOff = 0;
        this.yOff = 0;
        return newSensor;
    }
}

class V5AdiExpander extends V5Device{
    #adiDevices = [V5Device];
    #portsElem = null;
    firstPortIndex = null;

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
        this.portProtected= _port;
        // Update the port of all the devices in the list
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            this.#updateDevicePort(adiDevice, _port);
        }
        if(this.#portsElem !== null){
            this.#portsElem.id = "Expander_ADI_" + _port.toString();
        }
    }

    get port(){
        return this.portProtected;
    }

    /**
     * @param {any} _portsElem
     */
    set portsElem(_portsElem){
        this.#portsElem = _portsElem;
        this.#portsElem.id = "Expander_ADI" + this.portProtected.toString();
        this.port = this.portProtected; // Trigger port setter logic to update the port pair of all devices in this expander
        // Update all ports in the list to have proper self references
        for(var i = 1; i < 9; i++){
            var elem = _portsElem.querySelector("#port-" + (this.firstPortIndex + i).toString());
            ports[this.firstPortIndex + i - 1].self = elem;
            ports[this.firstPortIndex + i - 1].self.onmouseover = function(){
                portHoverCallback(this);
            };
            ports[this.firstPortIndex + i - 1].self.onmouseout = function(){
                portUnhoverCallback(this);
            };
            ports[this.firstPortIndex + i - 1].self.onclick = function(){
                portClickCallback(this, document.getElementById("adi-port-table"), document.getElementById("Options"));
            };
        }
    }

    get portsElem(){
        return this.#portsElem;
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
        if(this.numDevices() !== 0){
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
                // If so, delete the device outright and from the list and from ports array
                // Construct port letter offset (A = 0, B = 1, etc.) 
                // Needed bc #adiDevices is dynamically sized whereas no entries are ever removed from ports and every available port always exists in ports
                var portLetterOffset = adiDevice.port.split("\'")[1].charCodeAt(0) - 'A'.charCodeAt(0);
                ports[this.firstPortIndex + portLetterOffset].device = null; // Clear this port in ports array
                let dev = adiDevice.generate("{-1, \'A\'}"); // Delete the device outright by calling generate with default port without saving the result
                this.#adiDevices.splice(i, 1); // Remove the device from the expander object's internal (dynamically sized) list
                return dev;
            }
        }
    }

    numDevices(){
        return this.#adiDevices.length === undefined? 0 : this.#adiDevices.length;
    }

    getPortsIndexOf(_adiDevice){
        // Check if this device is contained in this expander
        if(this.getAdiDevice(_adiDevice) === null){
            throw new Error("Cannot get port index of ADI Device " + _adiDevice.name + " because it is not in ADI Expander " + this.name);
        }

        // Get the port letter. Ports can be just letters or port pairs
        var portLetter = _adiDevice.port.split("\'")[1].charAt(0);
        
        // Get the port letter offset (A = 0, B = 1, etc.)
        var portLetterOffset = portLetter.charCodeAt(0) - 'A'.charCodeAt(0);

        console.log("Port letter offset: " + portLetterOffset);
        console.log("First port index: " + this.firstPortIndex);

        // Return the port index
        return this.firstPortIndex + portLetterOffset;
    }

    toString(){
        this.#sortList();
        var str = this.name + " is an ADI Expander consisting of:\n\t";
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            str += "-" + adiDevice.toString() + "\n\t";
        }
        var debugStr = this.#portsElem === null? "null" : this.#portsElem.toString();
        str += "on port " + this.portProtected.toString();
        return str;
    }

    toPros(){
        this.#sortList();
        var str = "";
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            this.#updateDevicePort(adiDevice, this.port);
            str += adiDevice.toPros();
        }
        return str;
    }

    #clone(){
        return new V5AdiExpander(this.name, this.port, this.#adiDevices, this.self);
    }

    generate(_port){
        var newExpander = this.#clone();
        newExpander.port = _port;
        // Reset demo object
        this.portProtected= -1;
        this.name = newExpander.type;
        for(var i = 0, adiDevice; adiDevice = this.#adiDevices[i]; i++){
            this.removeAdiDevice(adiDevice); // Safely remove all devices from the demo object
        }
        if(_port !== -1){
            // Not deletion
            // Need to add 8 ports to the port list
            newExpander.firstPortIndex = ports.length; // For some reason we need a plus one here - JBH
            for(var i = 0; i < 8; i++){
                // Construct port pair
                var portPair = "{{" + _port.toString() + ", \'" + String.fromCharCode('A'.charCodeAt(0) + i) + "\'}}";
                var newPort = new V5Port(portPair, null);
                ports.push(newPort);
            }
        }
        this.#adiDevices = [];
        this.#portsElem = null;
        this.firstPortIndex = null;
        return newExpander;
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
        + this.portProtected.toString()
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
        this.portProtected= '{-1, \'A\'}';
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiAnalogIn(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= '{-1, \'A\'}';
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiDigitalIn(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= '{-1, \'A\'}';
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
        + this.portProtected.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiLineSensor(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= '{-1, \'A\'}';
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
        console.log(_port);
        super("ADI Encoder", _name, _port, _self);
        this.reversed = _reversed;
    }

    getImgUri(){
        const imgPath = path.join(context.extensionPath, "media", "ADI_Encoder.png");
        return panel?.webview.asWebviewUri(vscode.Uri.file(imgPath));
    }

    toPros(){
        // Check if in a port pair
        if(this.portProtected.charAt(0) === "{"){
            // Get the port letter for top port
            var topPort = this.portProtected.split("\'")[1].trim();
            // Lettered bottom port (one letter higher than port)
            var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
            // Get the numbered port from expander
            var portNum = parseInt(this.portProtected.split("{{")[1].split(",")); // Get just the number after the port pair
            // Generate port tuple (specific to this device)
            var prosPort = "{" + portNum + ", \'" + topPort + "\' , \'" + bottomPort + "\'}";

            return "extern pros::ADIEncoder "
            + this.name + " ("
            + prosPort.toString()
            + ", " + (this.reversed? "true" : "false")
            + ");\n";
        }

        // Get the port letter for top port. If here, we are in a brain ADI port so top port = this.portProtected
        var topPort = this.portProtected;
        // Lettered bottom port (one letter higher than port)
        var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
        return "extern pros::ADIEncoder "
        + this.name + " (\'"
        + topPort.toString()
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
        this.portProtected= '{-1, \'A\'}';
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
        if(this.portProtected.charAt(0) === "{"){
            // Get the port letter for top port
            var topPort = this.portProtected.split("\'")[1].trim();
            // Lettered bottom port (one letter higher than port)
            var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
            // Get the numbered port from expander
            var portNum = parseInt(this.portProtected.split("{{")[1].split(",")); // Get just the number after the port pair
            // Generate port tuple (specific to this device)
            var prosPort = "{" + portNum + ", \'" + topPort + "\' , \'" + bottomPort + "\'}";

            return "extern pros::ADIUltrasonic "
            + this.name + " ("
            + prosPort.toString()
            + ");\n";
        }

        // Get the port letter for top port. If here, we are in a brain ADI port so top port = this.portProtected
        var topPort = this.portProtected;
        // Lettered bottom port (one letter higher than port)
        var bottomPort = String.fromCharCode(topPort.charCodeAt(0) + 1);
        return "extern pros::ADIUltrasonic "
        + this.name + " (\'"
        + topPort.toString()
        + "\', \'" + bottomPort.toString()
        + ");\n";
    }

    #clone(){
        return new V5AdiUs(this.name, this.port, this.self);
    }

    generate(_port){
        var newSensor = this.#clone();
        newSensor.port = _port;
        // Reset demo object
        this.portProtected= '{-1, \'A\'}';
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
        + this.portProtected.toString()
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
        this.portProtected= '{-1, \'A\'}';
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
        this.port= _port;
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
        /** \n
         * THIS FILE WAS GENERATED BY THE PROS VSCODE EXTENSION'S ROBOT CONFIGURATOR \n
         * IT CONTAINS PORT CONFIGURATIONS \n
         **/ \n
        \n
        `;
        for(var i = 0, port; port = this.ports[i]; i++){
            str += port.toPros() + "\n";
        }
        return str;
    }

    toHTML(){
        var str = `
        /** <br>
         * THIS FILE WAS GENERATED BY THE PROS VSCODE EXTENSION'S ROBOT CONFIGURATOR <br>
         * IT CONTAINS PORT CONFIGURATIONS <br>
         **/ <br>
         <br>
        `;
        for(var i = 0, port; port = this.ports[i]; i++){
            if(i > 28){
                break; // ADI Expander devices will be duplicate if we go past 28
            }
            if(port.device !== null){
                if(port.device.type === "ADI Expander"){
                    let temp = port.device.toPros();
                    let arrTemp = temp.split(";"); // Split the string into an array of strings
                    for(var j = 0; j < arrTemp.length - 1; j++){
                        str += arrTemp[j] + ";<br>"; // Add a semicolon and a line break to each element of the array
                    }
                } else{
                    str += port.toPros() + "<br>";
                }
            }
        }
        return str;
    }
}

/**
 * 
 * HELPER FUNCTIONS
 * 
 */

function updatePROS(robot){
    // Reject if null or undefined robot arg
    if(robot === null || robot === undefined){
        return;
    }

    // Get the HTML element that contains the PROS code
    var prosElem = document.getElementById("Generated-PROS-Body");
    // Update the PROS code
    if(robot.ports !== null && robot.ports.length !== 0 && robot.toPros().includes("extern")){
        prosElem.innerHTML = robot.toHTML();
    } else{
        prosElem.innerHTML = "The PROS code generated from the configuration above will appear here.";
    }
}

/**
 * Updates the port elements on page
 * 
 * @param {HTMLElement} adiPortsElem The HTML Parent Element of all ADI port elements
 * @param {V5Robot} robot The robot object
 */
function updatePorts(adiPortsElem, robot = robotGlobal){
    for(var i = 0, port; port = ports[i]; i++){
        // Check if this port has a device
        if(port.device === null && !port.isAdi){
            // If not, set the image to empty
            //port.self.src = "media/Empty_Port.png";
            port.self.innerHTML = 
            `
            <h2>Port ${(i+1).toString()}</h2>
            `;
        } else if (!port.isAdi){
            // If so, set the image to the device's image
            //port.self.src = port.device.getImgUri();
            
            // Handle ADI Expander
            if(port.device.type === "ADI Expander"){
                // Get the smart port number
                var smartPort = parseInt(port.port);
                // Construct the target element id for this expander
                var rowID = smartPort.toString();
                // See if the html element already exists
                var expanderElem = document.getElementById(rowID);
                if(expanderElem === null && port.device.portsElem === null){
                    // If not, create it
                    adiPortsElem.insertAdjacentHTML("beforeend", `
                        <tr style="height:30px;" id = "Expander_ADI_${rowID}-title">
                            <td colspan = "8">
                                <center>
                                    <h3 style="margin:0px;">${port.device.name.toString()} (Port ${port.device.port})</h3>
                                </center>
                            </td>
                        </tr>
                        <tr class = "port-row" id = "Expander_ADI_${rowID}">
                            <td class = port-col id = "port-${port.device.firstPortIndex + 1}">
                                <h2>A</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 2}">
                                <h2>B</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 3}">
                                <h2>C</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 4}">
                                <h2>D</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 5}">
                                <h2>E</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 6}">
                                <h2>F</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 7}">
                                <h2>G</h2>
                            </td>
                            <td class = port-col id = "port-${port.device.firstPortIndex + 8}">
                                <h2>H</h2>
                            </td>
                        </tr>
                    `);
                    // Set the expander device's portsElem member to the expander's particular element
                    expanderElem = adiPortsElem.querySelector("#Expander_ADI_" + rowID.toString());
                    console.log("Test: " + expanderElem.id);
                    port.device.portsElem = expanderElem;
                } else if(expanderElem === null && port.device.portsElem !== null){
                    // This case is for when the expander is being moved from one port to another
                    // Use the adiExpander class's port setter fn to automatically repair the integrity of the class
                    port.device.port = smartPort;
                }
            }

            // Get device name + make it obey length rules
            var deviceName = port.device.name;
            if(deviceName.length > 10){
                deviceName = deviceName.substring(0, 10) + "...";
            }

            // Update the port element to display the device's name
            port.self.innerHTML = 
            `
            <h2>Port ${(i+1).toString()}</h2>
            <body>${deviceName}</body>
            `;
            // Construct target element id for title row
            var rowID = "Expander_ADI_" + port.device.port.toString() + "-title";
            // See if the html element already exists
            var titleElem = document.getElementById(rowID);
            if(titleElem !== null){
                // If so, update the name
                titleElem.innerHTML = 
                `
                <td colspan = "8">
                    <center>
                        <h3 style="margin:0px;">${port.device.name.toString()} (Port ${port.device.port})</h3>
                    </center>
                </td>
                `;
            }
        } else if(port.device === null && port.isAdi){
            // If not, set the image to empty
            //port.self.src = "media/Empty_Port.png";

            var adiPort;
            // Construct adi port letter
            if(port.port.charAt(0) === "{"){
                adiPort = port.port.split("\'")[1].trim();
            } else{
                adiPort = port.port;
            }

            // Check for two-port devices: label second port the same label as the first port
            if(ports[i-1].device !== null && (ports[i-1].device.type === "ADI Encoder" || ports[i-1].device.type === "ADI Ultrasonic")){
                // If so, set the image to the device's image
                //port.self.src = port.device.getImgUri();

                // Get device name + make it obey length rules
                var deviceName = ports[i-1].device.name;
                if(deviceName.length > 8){
                    deviceName = deviceName.substring(0, 8) + "...";
                }

                // Update the port element to display the device's name
                port.self.innerHTML =
                `
                <h2>${adiPort.charAt(0).toString()}</h2>
                <body>${deviceName}</body>
                `;
            } 
            else if(port.self !== null){  // port.self can be null if we are in the midst of initializing a new ADI Expander
                port.self.innerHTML = 
                `
                <h2>${adiPort.charAt(0).toString()}</h2>
                `;
            }
        } else if (port.isAdi){
            // If so, set the image to the device's image
            //port.self.src = port.device.getImgUri();

            // Get device name + make it obey length rules
            var deviceName = port.device.name;
            if(deviceName.length > 8){
                deviceName = deviceName.substring(0, 8) + "...";
            }

            var adiPort;
            // Construct adi port letter
            if(port.port.charAt(0) === "{"){
                adiPort = port.port.split("\'")[1].trim();
            } else{
                adiPort = port.port;
            }

            // Update the port element to display the device's name
            port.self.innerHTML = 
            `
            <h2>${adiPort.charAt(0).toString()}</h2>
            <body>${deviceName}</body>
            `;
        }
    }
    robot.ports = ports;
    updatePROS(robot); // This fn also includes the check it is wrapped in but it isn't a big deal to check twice
}

/**
 * Updates the options section of the page when a device is selected (from device table or any port)
 * 
 * @param {HTMLElement} optionsElem The HTML Parent Element of all options input elements
 */
function updateOptions(optionsElem, robot){
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
        updatePorts(document.getElementById("adi-port-table"), robot);
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
        <input type="button" id="Option_Delete" value="Delete">
        </input>
        <input type="button" id="Option_Port" value="Change Port">
        </input>
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

            // Update the page
            updatePorts(document.getElementById("adi-port-table"), robot);
            updateOptions(optionsElem, robot); 
        });
    } else if(device.type === "5.5W Motor" || device.type === "ADI Potentiometer" || device.type === "ADI Encoder" || device.type === "Rotation Sensor" || device.type === "Piston"){
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
        <input type="button" id="Option_Delete" value="Delete">
        </input>
        <input type="button" id="Option_Port" value="Change Port">
        </input>
        `;
    } else if(device.type === "Motor Group"){
        throw new Error("Motor Group options not yet implemented");
    } else if(device.type === "ADI Expander" || device.type === "IMU" || device.type === "Optical Sensor" || device.type === "Vision Sensor" || device.type === "Distance Sensor" || device.type === "ADI Analog In" || device.type === "ADI Digital In" || device.type === "ADI Line Sensor" || device.type === "ADI Ultrasonic"){
        // Parameters present: name
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}">
        </input>
        <input type="button" id="Option_Delete" value="Delete">
        </input>
        <input type="button" id="Option_Port" value="Change Port">
        </input>
        `;
    } else if(device.type === "GPS Sensor"){
        // Parameters present: name, x offset, y offset
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" value="${device.name}">
        </input>
        <input type="number" id="Option_X" value="${device.xOff}"
            <label for="Option_X">X Offset</label>
        </input>
        <input type="number" id="Option_Y" placeholder="${device.yOff}"
            <label for="Option_Y">Y Offset</label>
        </input>
        <input type="button" id="Option_Delete" value="Delete">
        </input>
        <input type="button" id="Option_Port" value="Change Port">
        </input>
        `;

        // Add GPS Sensor Unique Event Listeners
        let xInput = optionsElem.querySelector("#Option_X");
        xInput.addEventListener("input", function(){
            device.xOff = xInput.value;
            // Update the page
            updatePorts(document.getElementById("adi-port-table"), robot);
            updateOptions(optionsElem, robot); 
        });
        let yInput = optionsElem.querySelector("#Option_Y");
        yInput.addEventListener("input", function(){
            device.yOff = yInput.value;
            // Update the page
            updatePorts(document.getElementById("adi-port-table"), robot);
            updateOptions(optionsElem, robot); 
        });
    } else if(device.type === "ADI LED"){
        // Parameters present: name, length
        optionsElem.innerHTML = 
        `
        <h1>Options</h1>
        <input type="text" id="Option_Name" placeholder="${device.name}">
        </input>
        <input type="number" id="Option_Length" placeholder="${device.length}"
            <label for="Option_Length">Length</label>
        </input>
        <input type="button" id="Option_Delete" value="Delete">
        </input>
        <input type="button" id="Option_Port" value="Change Port">
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

    // Add event listeners to parameters shared by some devices (group select) if applicable to selected device:
    if(device.type.includes("Motor")){
        optionsElem.innerHTML += 
        `<select name="Group_Select" id="Group_Select">
        </select>`;
        let groupSelect = optionsElem.querySelector("#Group_Select");
        //  Add all motor groups to the group select
        var sortedGroups = [];
        var sortedIndices = [];
        var curGroup = null;
        // Check if in a group
        for(var i = 0, group = motorGroups[i]; i < motorGroups.length; i++){
            if(group.contains(device)){
                curGroup = group;
                sortedGroups.push(group.name);
                sortedIndices.push(i);
                sortedGroups.push("Ungroup");
                sortedIndicies.push(-1); //-1 = no group
                var sortAlpha = [];
                for(var j = 0; j < motorGroups.length; j++){+
                    console.log("1")
                    if(j !== i){
                        console.log("2");
                        sortAlpha.push(motorGroups[j].name);
                    }
                }
                // sort the groups in sortalpha by their names, associated index is in sortedIndices
                sortAlpha.sort();
                for(var j = 0; j < sortAlpha.length; j++){
                    console.log("3");
                    for(var k = 0; k < motorGroups.length; k++){
                        console.log("4");
                        if(motorGroups[k].name === sortAlpha[j]){
                            console.log("5");
                            sortedGroups.push(sortAlpha[j]);
                            sortedIndices.push(k);
                            break;
                        }
                    }
                } 
                break;
            }
        }
        // If not, add all groups to the group select with No Group as top option
        if(curGroup === null){
            console.log("Not in a group");
            sortedGroups.push("No Group");
            sortedIndices.push(-1); //-1 = no group
            var sortAlpha = [];
            // sort the groups in sortalpha by their names, associated index is in sortedIndices
            for(var i = 0; i < motorGroups.length; i++){
                sortAlpha.push(motorGroups[i].name);
                console.log("6");
            }
            sortAlpha.sort();
            for(var i = 0; i < sortAlpha.length; i++){
                console.log("7")
                for(var j = 0; j < motorGroups.length; j++){
                    console.log("8");
                    if(motorGroups[j].name === sortAlpha[i]){
                        console.log("9");
                        sortedGroups.push(sortAlpha[i]);
                        sortedIndices.push(j);
                        break;
                    }
                }
            }
        }
        // Add the sorted groups to the group select
        for(var i = 0; i < sortedGroups.length; i++){
            console.log("10");
            var option = document.createElement("option");
            option.value = sortedIndices[i];
            option.text = sortedGroups[i];
            groupSelect.appendChild(option);
        }
        // Add event listener to group select
        groupSelect.addEventListener("change", function(){
            if(groupSelect.value === -1){
                console.log("Ungrouping");
                // Check if in a group
                var deviceGroup = null;
                for(var i = 0; group = motorGroups[i]; i++){
                    console.log("11");
                    if(group.contains(device)){
                        console.log("12");
                        deviceGroup = group;
                        break;
                    }
                }
                // If so, remove the device from the group
                if(deviceGroup !== null){
                    console.log("13");
                    deviceGroup.remove(device);
                }
                
                // Update the page
                updatePorts(document.getElementById("adi-port-table"), robot);
                updateOptions(optionsElem, robot);
                return;
            } else{
                // Check if in a group
                var deviceGroup = null;
                console.log("14");
                for(var i = 0; group = motorGroups[i]; i++){
                    console.log("15");
                    if(group.contains(device)){
                        console.log("16");
                        deviceGroup = group;
                        break;
                    }
                }
                // If so, remove the device from the group
                if(deviceGroup !== null){
                    console.log("17");
                    deviceGroup.remove(device);
                }

                // Add the device to the selected group
                motorGroups[groupSelect.value].add(device);
            }
            // Update the page
            updatePorts(document.getElementById("adi-port-table"), robot);
            updateOptions(optionsElem, robot);
        });
    }

    // Add event listeners to parameters shared by all devices:
    // Name
    var nameInput = optionsElem.querySelector("#Option_Name");
    nameInput.addEventListener("input", function(){
        device.name = nameInput.value;

        // Update the page
        updatePorts(document.getElementById("adi-port-table"), robot);
        updatePROS(robot); // Don't call updateOptions here, otherwise you can't type in the name input without getting kicked after every individual letter
    });

    // Delete
    var deleteButton = optionsElem.querySelector("#Option_Delete");
    deleteButton.addEventListener("click", function(){
        // Delete device by calling generate() with default port and not saving the result
        // Has to be separate by ADI vs non ADI vs Motor Group/Expander (separate bc unique html deletion needs to occur)
        if(device.type === "Piston" || device.type === "ADI Potentiometer" || device.type === "ADI Analog In" || device.type === "ADI Digital In" || device.type === "ADI Line Sensor" || device.type === "ADI Encoder" || device.type === "ADI Ultrasonic" || device.type === "ADI LED"){
            // Demo object always has smartport # -1
            // Get the smartport number from the port pair (if it even is a port pair)
            var smartPort;
            var portLetter;
            // If device is in an expander, delete it from that expander. 
            if(device.port.charAt(0) === "{"){
                smartPort = parseInt(device.port.split("{{")[1].split(",")[0].trim());
                // Check if demo object
                if(smartPort > 0){
                    // If not, adjust associated expander
                    // Get the expander device object
                    var expander = ports[smartPort-1].device;
                    console.log("Expander info: " + expander.toString());
                    // Delete the device from the expander
                    expander.removeAdiDevice(device); //Automatically clears associated port 
                }
            } else {
                portLetter = device.port; // Get the port letter
                // Clear associated port if not a demo object
                let portIndex = 20 + portLetter.charCodeAt(0) - 65 + 1; // 21 is the index of the first ADI port in the ports array
                console.log("Port index: " + portIndex.toString());
                ports[portIndex].device = null;
            }
            // Delete the ADI device outright by calling generate() with default port and not saving the result
            device.generate('{-1, \'A\'}');
        } else if(device.type === "Motor Group"){
            throw new Error("Motor Group options not yet implemented");
        } else if(device.type === "ADI Expander"){
            // Delete the expander's row from the table
            // Construct the target element id for this expander
            var rowID = "Expander_ADI_" + device.port.toString();
            // See if the html element already exists
            console.log("Row ID: " + rowID);
            var expanderElem = document.getElementById(rowID);
            if(expanderElem !== null){
                // If so, delete it and its title element
                console.log("Deleting expander element: " + expanderElem.id);
                expanderElem.remove();
                document.getElementById(rowID + "-title").remove();
            }
            // Clear associated smartport
            if(device.port > 0){
                ports[device.port - 1].device = null;
            }
            // Delete the expander outright by calling generate() with default port and not saving the result
            device.generate(-1); // Automatically deletes all devices in the expander (clears associated ports too!)
        } else {
            // First, clear associated port if not a demo object (demo objects have smartport # -1)
            if(device.port > 0){
                ports[device.port - 1].device = null;
            }
            // Delete the smartport device outright by calling generate() with default port and not saving the result
            device.generate(-1);
        }

        // Update V5Robot object:
        robot = robot === undefined? robotGlobal : robot;
        robot.ports = ports;

        // Deselect all devices and ports
        deselectAll();
        // Update the page
        updatePorts(document.getElementById("adi-port-table"), robot);
        updateOptions(optionsElem, robot); // This will display the default options message
    });

    // Change Port
    var portButton = optionsElem.querySelector("#Option_Port");
    portButton.addEventListener("click", function(){
        changePorts(device, optionsElem, robot);
    });

    // Add event listeners to parameters shared by some devices (reversed) if applicable to selected device:
    if(device.type === "11W Motor" || device.type === "5.5W Motor" || device.type === "ADI Pot" || device.type === "ADI Encoder" || device.type === "Rotation Sensor" || device.type === "Piston"){
        let reversedInput = optionsElem.querySelector("#Option_Reversed");
        reversedInput.addEventListener("change", function(){
            device.reversed = reversedInput.checked;

            // Update the page
            updatePorts(document.getElementById("adi-port-table"), robot);
            updateOptions(optionsElem, robot); // This will display the default options message
        });
    }

    
}

function changePorts(device, optionsElem, robot, overwriting = false){
    if(device.port !== -1 && device.port !== '{-1, \'A\'}' && (device.type.includes("ADI") || device.type === "Piston") && device.type !== "ADI Expander"){
        // We need to turn the demo object into a clone of this object (except for port obviously) and then delete this object
        // This is because we need to preserve the device's options, and once it's held in the demo object, we can change its
        // Port by treating it just like any other new device
        // First, disable the button if a demo object
        if(device.port === '{-1, \'A\'}'){
            return;
        }
        // Clear the associated ADI port (must find port by its index in the ports array)
        // If device is in an expander, delete it from that expander.
        if(device.port.charAt(0) === "{"){
            // Get the port letter
            var portLetter = device.port.split("\'")[1].trim();
            // Get the numbered port from expander
            var portNum = device.port.split('{{')[1].split(',')[0]; // Get just the number after the port pair
            // Get the expander device object
            console.log("Port num: " + (portNum).toString() + " Port: " + device.port.toString());
            var expander = ports[parseInt(portNum)-1].device;
            // Use it to get ports index of this adi device
            var portIndex = expander.getPortsIndexOf(device);

            // Before deletion we need to generate it into the demo object
            var demoObject;
            var index;
            for(var i = 0, dev; dev = devices[i]; i++){
                if(dev.type === device.type){
                    demoObject = dev;
                    index = i;
                    console.log("Found demo object: " + demoObject.toString());
                    break;
                }
            }

            // Clear the associated smartport
            if(!overwriting){
                ports[portIndex].device = null;
            }

            // Set the demo object to a generation of this device with default port
            var selfTemp = demoObject.self;
            demoObject = device.generate('{-1, \'A\'}');
            demoObject.self = selfTemp;
            devices[index] = demoObject;

            // Select the demo object
            select(devices[index]);
        } else {
            portLetter = device.port; // Get the port letter
            // Clear associated port if not a demo object
            let portIndex = 20 + portLetter.charCodeAt(0) - 65 + 1; // 21 is the index of the first ADI port in the ports array

            var demoObject;
            var index;
            for(var i = 0, dev; dev = devices[i]; i++){
                if(dev.type === device.type){
                    demoObject = dev;
                    index = i;
                    console.log("Found demo object: " + demoObject.toString());
                    break;
                }
            }

            // Clear the associated smartport
            if(!overwriting){
                ports[portIndex].device = null;
            }

            // Set the demo object to a generation of this device with default port
            var selfTemp = demoObject.self;
            demoObject = device.generate('{-1, \'A\'}');
            demoObject.self = selfTemp;
            devices[index] = demoObject;

            // Select the demo object
            select(devices[index]);
        }
    }else {
        // We need to turn the demo object into a clone of this object (except for port obviously) and then delete this object
        // This is because we need to preserve the device's options, and once it's held in the demo object, we can change its
        // Port by treating it just like any other new device
        // First, disable the button if a demo object
        if(device.port === -1){
            return;
        }
        
        // Get the demo object of the same type
        var demoObject;
        var index;
        for(var i = 0, dev; dev = devices[i]; i++){
            if(dev.type === device.type){
                demoObject = dev;
                index = i;
                console.log("Found demo object: " + demoObject.toString());
                break;
            }
        }

        // Clear the associated smartport
        if(!overwriting){
            ports[device.port - 1].device = null;
        }

        // Set the demo object to a generation of this device with default port
        var selfTemp = demoObject.self;
        demoObject = device.generate(-1);
        demoObject.self = selfTemp;
        devices[index] = demoObject;

        // Select the demo object
        select(devices[index]);
    }
    // Update the page
    updatePorts(document.getElementById("adi-port-table"), robot);
    updateOptions(optionsElem, robot);
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
        if(port.self !== null){
            // Can be null in the midst of generating a new adi expander and its associated 8 new ports
            port.self.style.border = "1px transparent";
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
        if((device.type === "ADI Encoder" || device.type === "ADI Ultrasonic") && device.port !== '{-1, \'A\'}'){
            // Get smartport number
            var portIndex = 0;
            // Check for NaN
            if(device.port === 'A' || device.port === 'C' || device.port === 'E' || device.port === 'G'){
                // ADI Port on brain--convert 'A' --> 21, 'B' --> 22, etc.
                portIndex = 21 + device.port.charCodeAt(0) - 65;
            } else if(device.port !== '{-1, \'A\'}'){
                // Get the expander device, and to do this we need to get the smartport 
                var smartPort = parseInt(device.port.split("{{")[1].split(",")[0].trim());
                // Get the expander device object
                var expander = ports[smartPort-1].device;
                // Get ports index from expander via sick method
                portIndex = expander.getPortsIndexOf(device);
            }
            console.log("DESELECTING! index: " + portIndex.toString(), " Port: " + device.port.toString());
            ports[portIndex + 1].self.style.border = "1px transparent";
        }
        return;
    }
    //Else, select this device and deselect all others
    deselectAll();
    device.selected = true;
    device.self.style.border = "1px solid red";
    if((device.type === "ADI Encoder" || device.type === "ADI Ultrasonic") && device.port !== '{-1, \'A\'}'){
        // Get smartport number
        var portIndex = 0;
        // Check for NaN
        if(device.port === 'A' || device.port === 'C' || device.port === 'E' || device.port === 'G'){
            // ADI Port on brain--convert 'A' --> 21, 'B' --> 22, etc.
            portIndex = 21 + device.port.charCodeAt(0) - 65;
        } else if(device.port !== '{-1, \'A\'}'){
            // Get the expander device, and to do this we need to get the smartport 
            var smartPort = parseInt(device.port.split("{{")[1].split(",")[0].trim());
            // Get the expander device object
            var expander = ports[smartPort-1].device;
            // Get ports index from expander via sick method
            portIndex = expander.getPortsIndexOf(device);
        }
        console.log("SELECTING! index: " + portIndex.toString(), " Port: " + device.port.toString());
        ports[portIndex + 1].self.style.border = "1px solid red";
    }
    console.log("Selected device info: " + device.toString());
}

/**
 * Sets the hover color of a port depending on a few factors.
 * 
 * @param {HTMLElement} elem The mouseover event's target element
 */
function portHoverCallback(elem){
    var myID = parseInt(elem.id.split("-")[1]);
    var port = ports[myID - 1];
    // Ensure this port is not selected
    if(port.device !== null && !port.device.selected){
        elem.style.border = "1px solid blue";
    } else if(port.isAdi && ports[myID - 2].device !== null && (ports[myID - 2].device.type === "ADI Encoder" || ports[myID - 2].device.type === "ADI Ultrasonic")){
        if(!ports[myID - 2].device.selected){
            elem.style.border = "1px solid blue";
            ports[myID - 2].self.style.border = "1px solid blue";
        } else{
            elem.style.border = "1px solid red";
        }
    }
    else if(port.device === null){
        elem.style.border = "1px solid blue";
    } 
    if(port.device !== null && (port.device.type === "ADI Encoder" || port.device.type === "ADI Ultrasonic")){
        // Hover the other port
        ports[myID].self.style.border = "1px solid blue";
        if(port.device.selected){
            ports[myID].self.style.border = "1px solid red";
        }
    }

    

    // Don't make blue if this port is a mismatched type for generation
    // See if there is a device selected (triggers device generation)
    for(var k = 0; k < devices.length; k++){
        if(devices[k].selected){
            if(devices[k].type === "Motor Group"){
                // Motor Group itself is not placed on a port. Insetad, while the motor group is selected, motors in ports can be added to the group. So only smart ports with motors in them are eligible. If a port meets this condition, it should highlight green.
                if(port.device !== null && port.device.type.includes("Motor")){
                    elem.style.border = "1px solid green";
                } else {
                    elem.style.border = "1px transparent";
                }
                return;
            }
            // Check if port type is correct
            if((port.isAdi && (devices[k].type.includes("ADI") || devices[k].type.includes("Piston")) && !devices[k].type.includes("Expander")) 
            || (!port.isAdi && ((!devices[k].type.includes("ADI") || devices[k].type.includes("Expander")) && !devices[k].type.includes("Piston")))){
                // Additional checks for two-port devices (ADI Encoder, ADI Ultrasonic)
                if(devices[k].type === "ADI Encoder" || devices[k].type === "ADI Ultrasonic"){
                    // Get the port letter (could be either port pair or just port letter)
                    var portLetter;
                    if(port.port.charAt(0) === "{"){
                        portLetter = port.port.split("\'")[1].charAt(0);
                    } else{
                        portLetter = port.port;
                    }
                    // Ensure that the port letter is valid (ODD letter (A, C, E, G))
                    if(portLetter.charCodeAt(0) % 2 === 0){
                        elem.style.border = "1px transparent";
                        return;
                    }
                }
                
                elem.style.border = "1px solid blue";
                return;
            } else{
                // Mismatched port type + device type
                elem.style.border = "1px transparent"; 
                console.log("Mismatched port type and device type. Port is adi? " + port.isAdi.toString() + " . Device: " + devices[k].type.toString());
                return;
            }
        }
    }
}

/**
 * Sets the highlight color of a port when the mouse leaves it.
 * 
 * @param {HTMLElement} elem The mouseout event's target element
 */
function portUnhoverCallback(elem){
    var myID = parseInt(elem.id.split("-")[1]);
    var port = ports[myID - 1];
    // Ensure this port is not selected
    if(port.device !== null && !port.device.selected){
        elem.style.border = "1px transparent";
    } else if(port.isAdi && ports[myID - 2].device !== null && (ports[myID - 2].device.type === "ADI Encoder" || ports[myID - 2].device.type === "ADI Ultrasonic")){
        if(!ports[myID - 2].device.selected){
            elem.style.border = "1px transparent";
            ports[myID - 2].device.self.style.border = "1px transparent";
            return; 
        } else{
            elem.style.border = "1px solid red";
            return;
        }
    }else if(ports[myID - 1].device === null){
        elem.style.border = "1px transparent";
    } if(port.device !== null && (port.device.type === "ADI Encoder" || port.device.type === "ADI Ultrasonic")){
        // Unhover the other port
        ports[myID].self.style.border = "1px transparent";
        if(port.device.selected){
            ports[myID].self.style.border = "1px solid red";
        }
    }
}

/**
 * Callback event for when a port is clicked. Handles device generation and selection.
 * 
 * @param {HTMLElement} elem The port element that was clicked
 * @param {HTMLTableElement} adiTable The HTML Parent Element of all ADI port elements
 * @param {HTMLElement} options The HTML Parent Element of all options input elements
 * @param {V5Robot} robot The robot object
 */
function portClickCallback(elem, adiTable, options, robot){
    console.log("Port clicked: " + elem.id);
    // See if there is a device selected (triggers device generation)
    for(var k = 0; k < devices.length; k++){
        if(devices[k].selected){
            // If so, generate such a device for this port
            // Check if port type is correct
            var myID = parseInt(elem.id.split("-")[1]);
            var port = ports[myID - 1];
            var overwriting = port.device !== null; // If there is a device in this port, we are overwriting it
            var overwrittenDevice = overwriting? port.device : null; // If there is a device in this port, we are overwriting it
            if((port.isAdi && (devices[k].type.includes("ADI") || devices[k].type.includes("Piston")) && !devices[k].type.includes("Expander")) 
            || (!port.isAdi && ((!devices[k].type.includes("ADI") || devices[k].type.includes("Expander")) && !devices[k].type.includes("Piston")))){
                // Deselect the device (unless it is the motor group device)
                if(devices[k].type !== "Motor Group"){
                    deselectAll();
                }
                // Check for legal port if 2-port device (ADI Encoder, ADI Ultrasonic)
                if(devices[k].type === "ADI Encoder" || devices[k].type === "ADI Ultrasonic"){
                    // Ensure ADI port
                    if(!port.isAdi){
                        throw new Error("Illegal port for ADI Encoder or ADI Ultrasonic: " + port.port.toString());
                    }
                    // Get port letter (could be either port pair or just port letter)
                    var portLetter;
                    if(port.port.charAt(0) === "{"){
                        portLetter = port.port.split("\'")[1].charAt(0);
                    }
                    else{
                        portLetter = port.port;
                    }
                    // Ensure that the port letter is valid (ODD letter (A, C, E, G))
                    if(portLetter.charCodeAt(0) % 2 === 0){
                        throw new Error("Illegal port for ADI Encoder or ADI Ultrasonic: " + port.port.toString());
                    }
                }
                // Generate the device
                console.log(" Adding device " + devices[k].name + " to port " + port.port.toString());
                var device = devices[k].generate(port.port);
                device.self = elem;
                console.log("  Generated device: " + device.toString());
                port.device = device;
                // Add to expander (if applicable)
                if(port.isAdi && device.port.charAt(0) === "{"){
                    // Get the smart port number
                    var smartPort = parseInt(device.port.split("{{")[1].split(",")[0].trim());
                    // Get the expander object 
                    var expander = ports[smartPort-1].device;
                    // Add the device to the expander
                    expander.addAdiDevice(device);
                }
                // Select this new device if not a part of a motor group
                if(device.type !== "Motor Group"){
                    select(device);
                    // Update options to reflect this device
                }if(overwriting){
                    // If overwriting, call change ports on the overwritten device
                    changePorts(overwrittenDevice, options, robot, true); // true arg triggers overwriting
                }
                updateOptions(options, robot);
                updatePorts(adiTable, robot);
                return;
            } else{
                // Mismatched port type + device type
                throw new Error("Mismatched port type and device type. Port is adi? " + port.isAdi.toString() + " . Device: " + devices[k].type.toString());
            }
        }
    }
    var myID = parseInt(elem.id.split("-")[1]);
    var port = ports[myID - 1];
    // If not, see if there is a device in this port (configure existing device)
    if(port.device !== null){
        // If so, select the port
        select(port.device);
    } else if(port.isAdi && ports[myID - 2].device !== null && (ports[myID - 2].device.type === "ADI Encoder" || ports[myID - 2].device.type === "ADI Ultrasonic")){
        // If so, select the port
        console.log("Selecting 2port device by aux port!");
        select(ports[myID - 2].device);
    } else{
        // Empty port was clicked, deselect all
        deselectAll();
    }
    updateOptions(options, robot);
    updatePorts(adiTable, robot);
}

/**
 * 
 * GLOBAL DATA
 * 
 */

//Both of these are filled in window.onload
var ports = []; // Array of V5Port objects (ports 1-21 (which are indexes 0-20) followed by ADI ports A-H (which are indexes 21-28))
var devices = []; // Array of demo V5 Device Objects (see V5Device class)
var motorGroups = []; // Array of V5MotorGroup objects
var robotGlobal = null; // The V5Robot object

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
    const adiTable = document.getElementById("adi-port-table");
    const optionsBody = document.getElementById("Options-Body");
    const options = document.getElementById("Options");
    robotGlobal = new V5Robot();

    // HTML elements for adding specific listeners, initializing v5Devices
    const MOTOR_BIG = document.getElementById("11W Motor");
    const MOTOR_SMALL = document.getElementById("5.5W Motor");
    const MOTOR_GROUP = document.getElementById("Motor Group");
    const ROTATION_SENSOR = document.getElementById("Rotation Sensor");
    const IMU = document.getElementById("IMU");
    const PISTON = document.getElementById("Piston");
    const OPTICAL_SENSOR = document.getElementById("Optical Sensor");
    const VISION_SENSOR = document.getElementById("Vision Sensor");
    const DISTANCE_SENSOR = document.getElementById("Distance Sensor");
    const GPS_SENSOR = document.getElementById("GPS Sensor");
    const ADI_EXPANDER = document.getElementById("ADI Expander");
    const ADI_POT = document.getElementById("ADI Potentiometer");
    const ADI_ANALOG_IN = document.getElementById("ADI Analog In");
    const ADI_DIGITAL_IN = document.getElementById("ADI Digital In");
    const ADI_LINE_SENSOR = document.getElementById("ADI Line Sensor");
    const ADI_ENCODER = document.getElementById("ADI Encoder");
    const ADI_US = document.getElementById("ADI Ultrasonic");
    const ADI_LED = document.getElementById("ADI LED");

    devices.push(new V5Motor("11W Motor", -1, false, 11, 200, MOTOR_BIG));
    devices.push(new V5Motor("5.5W Motor", -1, false, 5.5, 200, MOTOR_SMALL));
    devices.push(new V5MotorGroup("Motor Group", -1, false, null, null, MOTOR_GROUP));
    devices.push(new V5RotationSensor("Rotation Sensor", 4, false, ROTATION_SENSOR));
    devices.push(new V5Imu("IMU", -1, IMU));
    devices.push(new V5Piston("Piston", '{-1, \'A\'}', false, PISTON));
    devices.push(new V5OpticalSensor("Optical Sensor", -1, OPTICAL_SENSOR));
    devices.push(new V5VisionSensor("Vision Sensor", -1, VISION_SENSOR));
    devices.push(new V5DistanceSensor("Distance Sensor", -1, DISTANCE_SENSOR));
    devices.push(new V5GpsSensor("GPS Sensor", -1, 0, 0, GPS_SENSOR));
    devices.push(new V5AdiExpander("ADI Expander", -1, [], ADI_EXPANDER));
    devices.push(new V5AdiPot("ADI Potentiometer", '{-1, \'A\'}', "V2", ADI_POT));
    devices.push(new V5AdiAnalogIn("ADI Analog In", '{-1, \'A\'}', ADI_ANALOG_IN));
    devices.push(new V5AdiDigitalIn("ADI Digital In", '{-1, \'A\'}', ADI_DIGITAL_IN));
    devices.push(new V5AdiLineSensor("ADI Line Sensor", '{-1, \'A\'}', ADI_LINE_SENSOR));
    devices.push(new V5AdiEncoder("ADI Encoder", '{-1, \'A\'}', false, ADI_ENCODER));
    devices.push(new V5AdiUs("ADI Ultrasonic", '{-1, \'A\'}', ADI_US));
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
                updateOptions(options, robotGlobal);
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
            portClickCallback(this, adiTable, options, robotGlobal);
        };
        col.onmouseover = function(){
            portHoverCallback(this);
        };
        col.onmouseout = function(){
            portUnhoverCallback(this);
        };
    }
    robotGlobal.ports = ports;
    updatePorts(adiTable, robotGlobal);
});
