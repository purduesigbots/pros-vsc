import * as child_process from "child_process";
import { promisify } from "util";
import { getChildProcessPath } from "./path";
var fetch = require("node-fetch");

export async function getCurrentReleaseVersion(url: string) {
  // Fetch the url
  const response = await fetch(url);
  if (!response.ok) {
    console.log(response.url, response.status, response.statusText);
    throw new Error(`Can't fetch release: ${response.statusText}`);
  }
  // Get the version number from the returned json
  const json = await response.json();
  var vString = json.tag_name;
  return vString;
}

export async function getCurrentVersion(oneClickPath: string) {
  try {
    console.log(oneClickPath);
    const { stdout, stderr } = await promisify(child_process.exec)(
      `${oneClickPath} --version`,
      {
        env: {
          ...process.env,
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
      const { stdout, stderr } = await promisify(child_process.exec)(
        `pros --version`,
        {
          env: {
            ...process.env,
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
      return [-1, false];
    }
  }
}

export async function getInstallPromptTitle(oneClickPath: string) {
  const recent = +(
    await getCurrentReleaseVersion(
      "https://api.github.com/repos/purduesigbots/pros-cli/releases/latest"
    )
  ).replace(/\./gi, "");
  const [version, oneClicked] = await getCurrentVersion(oneClickPath);

  if (!oneClicked && version === -1) {
    return "You do not have the PROS CLI installed. Install it now? (Recommended).";
  } else if (oneClicked && version >= recent) {
    return "PROS is up to date!";
  } else if (oneClicked && version < recent) {
    return "There is an update available! Would you like to update now?";
  } else if (version >= recent) {
    return "PROS detected but not installed with VSCode. Would you like to install using VSCode? (Recommended).";
  } else {
    return "An outdated version of PROS was detected on your system, not installed through VS Code. Would you like to install the update with VS Code?";
  }
}
