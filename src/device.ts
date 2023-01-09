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
    
    constructor(rawJSON: any) {
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