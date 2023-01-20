import { promisify } from "util";
import * as child_process from "child_process";
import { getChildProcessPath } from "./one-click/path";
import { prosLogger } from "./extension";
import { PREFIX } from "./commands/cli-parsing";
import { StatusBarItem } from "vscode";

/* eslint-disable @typescript-eslint/naming-convention */
export type DeviceInfo = {
    port: number;
    type: string;
    status: number;
    version: string;
    boot: string;
};

export enum DeviceType {
    Motor = 2,
    LED = 3,
    Rotation = 4,
    WorkcellMotor = 5,
    Inertial = 6,
    Distance = 7,
    Radio = 8,
    Controller = 9,
    Brain = 10,
    Vision = 11,
    ADI = 12,
    Partner = 13,
    Battery = 14,
    Solenoid = 15,
    Optical = 16,
    Magnet = 17,
    RadioInternal = 22,
    SerialDevice = -127
}

export type ProgramInfo = {
    slot: number;
    file: string;
    binfile: string;
    size: number;
    type: string;
    time: string;
};

export class V5DeviceInfo {
    vexos: string;
    cpu0: string;
    cpu1: string;
    ssn: string;
    name: string;
    team: string;
    programs: ProgramInfo[];
    currentSlot: number;
    devices: DeviceInfo[];
    
    constructor(raw: string) {
        let rawJSON = JSON.parse(raw);
        this.vexos = formatVersion(rawJSON.v5.brain.vexos);
        this.cpu0 = formatVersion(rawJSON.v5.brain.cpu0);
        this.cpu1 = formatVersion(rawJSON.v5.brain.cpu1);
        this.ssn = rawJSON.v5.brain.ssn;
        this.name = rawJSON.v5.brain.name;
        this.team = rawJSON.v5.brain.team;
        this.programs = rawJSON.v5.programs.items;
        resolveSlot(this.programs);
        this.currentSlot = currentSlot;
        this.programs.forEach(element => {
            element.slot = element.slot + 1;
        });
        this.devices = [];
        rawJSON.v5.devices.items.forEach((element: any) => {
            this.devices.push({
                port: element.port,
                type: DeviceType[element.type],
                status: element.status,
                version: formatVersion(element.version),
                boot: formatVersion(element.boot)
            });
        });
    }
};

const formatVersion = (rawVersion: string) : string => {
    let versionNumber = Number(rawVersion);
    let firstNumber = versionNumber % 256;
    versionNumber = ~~(versionNumber/256);
    let secondNumber = versionNumber % 256;
    versionNumber = ~~(versionNumber/256);
    let thirdNumber = versionNumber % 256;
    versionNumber = ~~(versionNumber/256);
    return `${versionNumber}.${thirdNumber}.${secondNumber}.${firstNumber}`;
};

export type PROSDeviceInfo = {
    device: string;
    desc: string;
};

var currentPort = "";
var portList: PROSDeviceInfo[] = [];
var currentSlot: number = 0;

export const getV5ComPorts = (): PROSDeviceInfo[] => {
    return portList;
};

const getV5ComPortsInternal = async (): Promise<PROSDeviceInfo[]> => {
    const {stdout, stderr} = await promisify(child_process.exec)("pros lsusb --machine-output", {
        timeout: 5000,
        env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        PATH: getChildProcessPath(),
        },
    });
    
    if (stderr) {
        await prosLogger.log(
          "OneClick",
          `VEXCOM verification failed with error ${stderr}`,
          "error"
        );
        console.log(stderr);
    }

    for (let line of stdout.split(/\r?\n/)) {
        if (line.startsWith(PREFIX)) {
            let jdata = JSON.parse(line.substring(PREFIX.length));
            if (jdata.type === "finalize") {
                return jdata.data[0].devices;
            }
        }
    }
    return [];
};

export const getV5DeviceInfo = async (port: string): Promise<V5DeviceInfo> => {
    var command = `vexcom --json ${port}`;
    const { stdout, stderr } = await promisify(child_process.exec)(command, {
        timeout: 5000,
        env: {
          ...process.env,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          PATH: getChildProcessPath(),
        },
    });
    
    if (stderr) {
        await prosLogger.log(
            "OneClick",
            `VEXCOM verification failed with error ${stderr}`,
            "error"
        );
        console.log(stderr);
    }
    return new V5DeviceInfo(stdout);
};

const resolvePort = async (status: StatusBarItem): Promise<void> => {
    let v5Ports = await getV5ComPortsInternal();
    if (v5Ports.length === 0) {
        currentPort = "";
        status.text = "No V5 ports found!";
    } else if (v5Ports.length === 1) {
        currentPort = v5Ports[0].device;
        status.text = v5Ports[0].desc;
    } else {
        let currentPortActive = v5Ports.some(port => {
            if (port.device === currentPort) {
                status.text = port.desc;
                return true;
            }
            return false;
        });
        if (!currentPortActive) {
            currentPort = v5Ports[0].device;
            status.text = v5Ports[0].desc;
        }
    }
    portList = v5Ports;
};

const resolveSlot = (programs: ProgramInfo[]): void => {
    if (programs.length === 0) {
        currentSlot = 0;
    } else if (programs.length === 1) {
        currentSlot = programs[0].slot + 1;
    } else {
        if (programs.every(program => Number(program.slot + 1) !== Number(currentSlot))) {
            currentSlot = programs[0].slot + 1;
        }
    }
};

export const setPort = (port: string): void => {
    currentPort = port;
};

export const getCurrentPort = (): string => {
    return currentPort;
};

export const getCurrentSlot = (): number => {
    return currentSlot;
};

export const setSlot = (slot: number): void => {
    currentSlot = slot;
};

export const startPortMonitoring = (status: StatusBarItem): void => {
    status.show();
    setInterval(resolvePort, 500, status);
};
