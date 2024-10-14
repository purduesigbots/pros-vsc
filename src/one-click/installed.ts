import * as child_process from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import { prosLogger } from "../extension";
import { getChildProcessPath } from "./path";
var fetch = require("node-fetch");

export async function getCurrentReleaseVersion(url: string) {
  // Fetch the url
  const response = await fetch(url);
  if (!response.ok) {
    console.log(response.url, response.status, response.statusText);
    vscode.window.showErrorMessage(
      "Could not fetch the current release version"
    );

    return 0;
  }
  // Get the version number from the returned json
  const json = await response.json();
  var vString = json.tag_name;
  return vString;
}

export async function getCurrentVersion(
  oneClickPath: string
): Promise<[string, boolean]> {
  try {
    console.log(oneClickPath);
    prosLogger.log(
      "OneClick",
      "Executing PROS with One-Click Install directory: " + oneClickPath
    );
    const { stdout } = await promisify(child_process.exec)(
      `"${oneClickPath}" --version`,
      {
        env: {
          ...process.env,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          PATH: getChildProcessPath(),
        },
      }
    );
    const version = stdout
      .replace("pros, version ", "");
    return [version, true];
  } catch {
    try {
      const { stdout } = await promisify(child_process.exec)(`pros --version`, {
        env: {
          ...process.env,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          PATH: getChildProcessPath(),
        },
      });
      const version = stdout
        .replace("pros, version ", "");
      return [version, false];
    } catch (err) {
      console.log(`Error fetching PROS CLI version: ${err}`);
      prosLogger.log(
        "OneClick",
        `Error fetching PROS CLI version: ${err}`,
        "ERROR"
      );
      return ["0.0.0", false];
    }
  }
}

export async function getToolchainVersion(oneClickPath: string): Promise<[string, boolean]> {
  try {
    console.log(oneClickPath);
    prosLogger.log(
      "OneClick",
      "Executing toolchain with One-Click Install directory: " + oneClickPath
    );
    const { stdout } = await promisify(child_process.exec)(
      `"${oneClickPath}" -dumpversion`,
      {
        env: {
          ...process.env,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          PATH: getChildProcessPath(),
        },
      }
    );
    return [stdout, true];
  } catch {
    try {
      const { stdout } = await promisify(child_process.exec)(`arm-none-eabi-g++ --version`, {
        env: {
          ...process.env,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          PATH: getChildProcessPath(),
        },
      });
      return [stdout, false];
    } catch (err) {
      console.log(`Error fetching PROS toolchain version: ${err}`);
      prosLogger.log(
        "OneClick",
        `Error fetching PROS toolchain version: ${err}`,
        "ERROR"
      );
      return ["0.0.0", false];
    }
  }
}
