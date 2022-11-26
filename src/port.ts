import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-interface';
import { getOperatingSystem } from './one-click/install';
import { commands, StatusBarItem, window } from 'vscode';

export var currentPort = "";

async function getV5ComPorts() {
    return (await SerialPort.list()).filter(port => {
        return port.vendorId === "2888" && isComPort(port);
    });
};

function isComPort(port: PortInfo) {
    switch(getOperatingSystem()) {
        case "windows": 
            return port.pnpId?.includes("MI_00") || port.pnpId?.includes("MI_01");
        case "macos":
            let id = port.path.slice(-1);
            return id === "1" || id === "2";
        default:
            return port.pnpId?.includes("if00") || port.pnpId?.includes("if01");
    }
}

function getPortType(port: PortInfo) {
    if (port.productId === "0501") {
        return "V5 Brain";
    }
    else if (port.productId === "0503") {
        return "V5 Controller";
    } else {
        return "Unknown V5 Device";
    }
}

async function resolvePort(status: StatusBarItem) {
    let v5Ports = await getV5ComPorts();
    if (v5Ports.length === 0) {
        currentPort = "";
        status.text = "No V5 ports found!";
    } else if (v5Ports.length === 1) {
        currentPort = v5Ports[0].path;
        status.text = `${getPortType(v5Ports[0])}: ${currentPort}`;
    } else {
        let currentPortActive = v5Ports.some(port => {
            return port.path === currentPort;
        });
        if (!currentPortActive) {
            currentPort = v5Ports[0].path;
            status.text = `${getPortType(v5Ports[0])}: ${currentPort}`;
        }
    }
}

async function selectPort(status: StatusBarItem) {
    let v5Ports = await getV5ComPorts();
    if (v5Ports.length > 1) {
        let selectedPort = await window.showQuickPick(v5Ports.map(port => `${getPortType(port)}: ${port.path}`),
        {
            title: "Select a v5 device",
            canPickMany: false
        });
        if (selectedPort) {
            status.text = selectedPort;
            v5Ports.forEach(port => {
                if (selectedPort?.endsWith(port.path)) {
                    currentPort = port.path;
                }
            });
        }
    }
}

export function startPortMonitoring(status: StatusBarItem) {
    commands.registerCommand("pros.selectPort", async () => {
        selectPort(status);
    });
    status.show();
    status.command = "pros.selectPort";
    setInterval(resolvePort, 500, status);
}