import { promisify } from "util";
import * as child_process from "child_process";
import { getChildProcessPath } from "./one-click/path";
import { prosLogger } from "./extension";
import { PREFIX } from "./commands/cli-parsing";
import { StatusBarItem } from "vscode";

/* eslint-disable @typescript-eslint/naming-convention */
export type DeviceInfo = {
    port: number;
    type: DeviceType;
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
    devices: DeviceInfo[];
    
    constructor(raw: string) {
        let rawJSON = JSON.parse(raw);
        this.vexos = rawJSON.v5.brain.vexos;
        this.cpu0 = rawJSON.v5.brain.cpu0;
        this.cpu1 = rawJSON.v5.brain.cpu1;
        this.ssn = rawJSON.v5.brain.ssn;
        this.name = rawJSON.v5.brain.name;
        this.team = rawJSON.v5.brain.team;
        this.programs = rawJSON.v5.programs.items;
        this.devices = rawJSON.v5.devices.items;
    }
};

export type PROSDeviceInfo = {
    device: string;
    desc: string;
};

var currentPort = "";

export const getV5ComPorts = async (): Promise<PROSDeviceInfo[]> => {
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

export const resolvePort = async (status: StatusBarItem): Promise<void> => {
    let v5Ports = await getV5ComPorts();
    if (v5Ports.length === 0) {
        currentPort = "";
        status.text = "No V5 ports found!";
    } else if (v5Ports.length === 1) {
        currentPort = v5Ports[0].device;
        status.text = v5Ports[0].desc;
    } else {
        let currentPortActive = v5Ports.some(port => {
            return port.device === currentPort;
        });
        if (!currentPortActive) {
            currentPort = v5Ports[0].device;
            status.text = v5Ports[0].desc;
        }
    }
};

export const getCurrentPort = (): string => {
    return currentPort;
};

export const startPortMonitoring = (status: StatusBarItem): void => {
    status.show();
    setInterval(resolvePort, 500, status);
};