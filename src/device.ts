import { promisify } from "util";
import * as child_process from "child_process";
import { getChildProcessPath } from "./one-click/path";
import { prosLogger } from "./extension";
import { PREFIX } from "./commands/cli-parsing";
import { StatusBarItem, window, workspace } from "vscode";
import { BaseCommand } from "./commands";
try {
  var usb = require("usb").usb;
} catch (err) {
  usb = null;
}

/* eslint-disable @typescript-eslint/naming-convention */
export type DeviceInfo = {
  port: number;
  type: string;
  status: number;
  version: string;
  boot: string;
};

const deviceTypeMap: Record<number, string> = {
  2: "11W Motor",
  3: "LED",
  4: "Rotation Sensor",
  5: "5.5W Motor",
  6: "IMU",
  7: "Distance Sensor",
  8: "Radio",
  9: "Controller",
  10: "Brain",
  11: "Vision Sensor",
  12: "ADI Expander",
  14: "Battery Sensor",
  16: "Optical Sensor",
  17: "Magnet",
  "-128": "Generic Sensor",
  "-127": "Generic Serial",
};

export type ProgramInfo = {
  slot: number;
  file: string;
  binfile: string;
  size: number;
  type: string;
  time: string;
};

export class V5DeviceInfo {
  vexos: string = "";
  cpu0: string = "";
  cpu1: string = "";
  ssn: string = "";
  name: string = "";
  team: string = "";
  programs: ProgramInfo[] = [];
  devices: DeviceInfo[] = [];

  constructor(raw: string) {
    let rawJSON = JSON.parse(raw);
    if (rawJSON.v5.brain) {
      this.vexos = formatVersion(rawJSON.v5.brain.vexos);
      this.cpu0 = formatVersion(rawJSON.v5.brain.cpu0);
      this.cpu1 = formatVersion(rawJSON.v5.brain.cpu1);
      this.ssn = rawJSON.v5.brain.ssn;
      this.name = rawJSON.v5.brain.name;
      this.team = rawJSON.v5.brain.team;
      this.programs = rawJSON.v5.programs.items;
      this.programs.forEach((element) => {
        element.slot = element.slot + 1;
      });
      rawJSON.v5.devices.items.forEach((element: any) => {
        if (element.port > 21) {
          return;
        }
        this.devices.push({
          port: element.port,
          type: deviceTypeMap[element.type],
          status: element.status,
          version: formatVersion(element.version),
          boot: formatVersion(element.boot),
        });
      });
    }
  }
}

const formatVersion = (rawVersion: string): string => {
  let versionNumber = Number(rawVersion);
  let firstNumber = versionNumber % 256;
  versionNumber = ~~(versionNumber / 256);
  let secondNumber = versionNumber % 256;
  versionNumber = ~~(versionNumber / 256);
  let thirdNumber = versionNumber % 256;
  versionNumber = ~~(versionNumber / 256);
  return `${versionNumber}.${thirdNumber}.${secondNumber}.${firstNumber}`;
};

export type PROSDeviceInfo = {
  device: string;
  desc: string;
};

var currentPort = "";
var portList: PROSDeviceInfo[] = [];
var suspended = false;

export const getV5ComPorts = (): PROSDeviceInfo[] => {
  return portList;
};

const getV5ComPortsInternal = async (): Promise<PROSDeviceInfo[]> => {
  const { stdout, stderr } = await promisify(child_process.exec)(
    `pros lsusb --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`,
    {
      timeout: 5000,
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        PATH: getChildProcessPath(),
      },
    }
  );

  if (stderr) {
    await prosLogger.log(
      "OneClick",
      `pros lsusb failed with error ${stderr}`,
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
      `VEXCOM failed with error ${stderr}`,
      "error"
    );
    console.log(stderr);
  }
  return new V5DeviceInfo(stdout);
};

const resolvePort = async (status: StatusBarItem): Promise<void> => {
  if (suspended) {
    return;
  }
  let v5Ports = await getV5ComPortsInternal();

  let showNotifications =
    workspace
      .getConfiguration("pros")
      .get<boolean>("pros.show Device Connect Notifications") ?? true;

  if (showNotifications) {
    // detect changes in device list
    let oldDevices = portList.map((portInfo) => portInfo.desc);
    let newDevices = v5Ports.map((portInfo) => portInfo.desc);

    oldDevices.forEach((device) => {
      if (!newDevices.includes(device)) {
        window.showInformationMessage(`Device ${device} has disconnected!`);
      }
    });
    newDevices.forEach((device) => {
      if (!oldDevices.includes(device)) {
        window.showInformationMessage(`Device ${device} has connected!`);
      }
    });
  }

  if (v5Ports.length === 0) {
    currentPort = "";
    status.text = "No V5 Devices Found!";
  } else if (v5Ports.length === 1) {
    currentPort = v5Ports[0].device;
    status.text = formatDescription(v5Ports[0].desc);
  } else {
    let currentPortActive = v5Ports.some((port) => {
      if (port.device === currentPort) {
        status.text = formatDescription(port.desc);
        return true;
      }
      return false;
    });
    if (!currentPortActive) {
      currentPort = v5Ports[0].device;
      status.text = formatDescription(v5Ports[0].desc);
    }
  }
  portList = v5Ports;
};

const formatDescription = (description: string): string => {
  if (description.includes("Communications") || description.includes("Brain")) {
    return "$(pros-v5-brain) " + description;
  } else if (description.includes("Controller")) {
    return "$(pros-v5-controller) " + description;
  } else {
    return "$(pros-v5-unknown) " + description;
  }
};

export const setPort = (port: string): void => {
  currentPort = port;
};

export const suspend = (): void => {
  suspended = true;
};

export const unsuspend = (): void => {
  suspended = false;
};

export const getCurrentPort = (): string => {
  return currentPort;
};

export const setName = async (name: string): Promise<void> => {
  const setRobotNameCommand: BaseCommand = new BaseCommand({
    command: "vexcom",
    args: ["--robot", name, currentPort],
    message: "Setting Robot Name",
    requiresProsProject: false,
  });

  try {
    await setRobotNameCommand.runCommand();
  } catch (err: any) {
    await window.showErrorMessage(err.message);
  }
};

export const setTeam = async (team: string): Promise<void> => {
  const setTeamNameCommand: BaseCommand = new BaseCommand({
    command: "vexcom",
    args: ["--team", team, currentPort],
    message: "Setting Team Name",
    requiresProsProject: false,
  });

  try {
    await setTeamNameCommand.runCommand();
  } catch (err: any) {
    await window.showErrorMessage(err.message);
  }
};

export const startPortMonitoring = (status: StatusBarItem): void => {
  if (usb) {
    status.show();
    usb.addListener("attach", () => {
      resolvePort(status);
    });
    usb.addListener("detach", () => {
      resolvePort(status);
    });
    resolvePort(status);
  }
};
