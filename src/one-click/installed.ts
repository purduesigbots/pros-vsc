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
): Promise<[number, boolean]> {
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
    const versionint = +stdout
      .replace("pros, version ", "")
      .replace(/\./gi, "");
    return [versionint, true];
  } catch {
    try {
      const { stdout } = await promisify(child_process.exec)(
        `pros --version`,
        {
          env: {
            ...process.env,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            PATH: getChildProcessPath(),
          },
        }
      );
      const versionint = +stdout
        .replace("pros, version ", "")
        .replace(/\./gi, "");
      return [versionint, false];
    } catch (err) {
      console.log(`Error fetching PROS CLI version: ${err}`);
      prosLogger.log("OneClick", `Error fetching PROS CLI version: ${err}`, "ERROR");
      return [-1, false];
    }
  }
}
