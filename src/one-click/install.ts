import * as vscode from "vscode";

import * as path from "path";
import * as os from "os";
import { downloadextract, chmod } from "./download";
import {
  getCurrentVersion,
  getCurrentReleaseVersion,
} from "./installed";
import * as fs from "fs";
import { promisify } from "util";
import * as child_process from "child_process";
import { URL } from "url";
import {
  getChildProcessPath,
  getIntegratedTerminalPaths,
  getChildProcessProsToolchainPath,
} from "./path";
import { prosLogger } from "../extension";
import { BackgroundProgress } from "../logger";
import * as device from "../device";
//TOOLCHAIN and CLI_EXEC_PATH are exported and used for running commands.
export var TOOLCHAIN: string;
export var CLI_EXEC_PATH: string;
export var PATH_SEP: string;

export const getOperatingSystem = () => {
  if (process.platform === "win32") {
    return "windows";
  }
  if (process.platform === "darwin") {
    return "macos";
  }
  return "linux";
};

export async function removeDirAsync(directory: string, begin: boolean) {
  // get all files in directory
  if (begin) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Cleaning Directory",
        cancellable: false,
      },
      async (progress, token) => {
        await removeDirAsync(directory, false);
      }
    );
  }
  const files = await fs.promises.readdir(directory);
  if (files.length > 0) {
    // iterate through found files and directory
    for (const file of files) {
      if ((await fs.promises.lstat(path.join(directory, file))).isDirectory()) {
        // if the file is found to be a directory,
        // recursively call this function to remove subdirectory
        await removeDirAsync(path.join(directory, file), false);
      } else {
        //delete the file
        await fs.promises.unlink(path.join(directory, file));
      }
    }
  }
  // delete the directory now that it is empty.
  await fs.promises.rmdir(directory, { recursive: true, maxRetries: 20 });
  return true;
}

export async function uninstall(context: vscode.ExtensionContext) {
  const globalPath = context.globalStorageUri.fsPath;
  const title = "Are you sure you want to uninstall PROS?";
  const labelResponse = await vscode.window.showInformationMessage(
    title,
    "Uninstall Now!",
    "No Thanks."
  );
  if (labelResponse === "Uninstall Now!") {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Uninstalling PROS",
        cancellable: false,
      },
      async () => {
        let promises: Promise<any>[] = [];
        promises.push(removeDirAsync(path.join(globalPath, "install"), false));
        promises.push(removeDirAsync(path.join(globalPath, "download"), false));
        await Promise.all(promises);
      }
    );
    vscode.window.showInformationMessage("PROS Uninstalled!");
  }
}

async function getUrls(
  cliVersion: number,
  toolchainVersion: string,
  vexcomVersion: string
) {
  var downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-lin-64bit.zip`;
  var downloadToolchain =
    "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2";
  var downloadVexcom = `https://pros.cs.purdue.edu/v5/_static/releases/vexcom_${vexcomVersion}-linux-x64.zip`;

  await prosLogger.log(
    "OneClick",
    `Selecting proper download URLS for CLI and Toolchain`
  );
  if (getOperatingSystem() === "windows") {
    await prosLogger.log("OneClick", `Windows detected, using Windows URLS`);
    // Set system, path seperator, and downloads to windows version
    downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-win-64bit.zip`;
    downloadToolchain = `https://github.com/purduesigbots/toolchain/releases/download/${toolchainVersion}/pros-toolchain-windows-formatted.zip`;
    downloadVexcom = `https://pros.cs.purdue.edu/v5/_static/releases/vexcom_${vexcomVersion}-win32.zip`;
  } else if (getOperatingSystem() === "macos") {
    await prosLogger.log("OneClick", `MacOS detected, using MacOS URLS`);
    // Set system, path seperator, and downloads to windows version
    downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-macos-64bit.zip`;
    downloadToolchain =
      "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2";
    downloadVexcom = `https://pros.cs.purdue.edu/v5/_static/releases/vexcom_${vexcomVersion}-osx.zip`;
    os.cpus().some((cpu) => {
      if (cpu.model.includes("Apple M")) {
        downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-macos-arm64bit.zip`;
      }
    });
  } else {
    await prosLogger.log("OneClick", `Linux detected, using Linux URLS`);
  }

  const customCli =
    vscode.workspace
      .getConfiguration("pros")
      .get<string>("OneClick: CliDownloadURL") ?? "default";
  const customToolchain =
    vscode.workspace
      .getConfiguration("pros")
      .get<string>("OneClick: ToolchainDownloadURL") ?? "default";
  await prosLogger.log("OneClick", `Checking for custom installation URLs`);
  console.log(`Custom URLS: ${customCli} | ${customToolchain}`);
  if (customCli !== "default") {
    try {
      downloadCli = customCli === "default" ? downloadCli : customCli;
      await prosLogger.log(
        "OneClick",
        `Using custom CLI download URL: ${downloadCli}`
      );
    } catch (e: any) {
      await prosLogger.log("OneClick", `Invalid custom CLI URL: ${customCli}`);
      console.log(
        "CLI Url specified in PROS extension settings was invalid. Using default instead"
      );
    }
  }

  if (customToolchain !== "default") {
    try {
      downloadToolchain =
        customToolchain === "default" ? downloadToolchain : customToolchain;
      await prosLogger.log(
        "OneClick",
        `Using custom Toolchain download URL: ${downloadToolchain}`
      );
    } catch (e: any) {
      await prosLogger.log(
        "OneClick",
        `Invalid custom Toolchain URL: ${customToolchain}`
      );
      console.log(
        "Toolchain Url specified in PROS extension settings was invalid. Using default instead"
      );
    }
  }

  return [downloadCli, downloadToolchain, downloadVexcom];
}

export async function install(context: vscode.ExtensionContext) {
  const preparingInstall = new BackgroundProgress(
    "Verifying Current PROS Installation",
    false,
    true
  );

  await prosLogger.log(
    "OneClick",
    "Configuring Environment Variables for PROS"
  );
  await configurePaths(context);
  await prosLogger.log("OneClick", "Fetching Operating System....");
  const system = getOperatingSystem();

  await prosLogger.log("OneClick", `Operating System Detected: ${system}`);

  await prosLogger.log("OneClick", "Fetching Latest CLI Version....");

  let cliVersion, releaseVersionNumber, toolchainVersion;
  try {
    cliVersion = await getCurrentReleaseVersion(
      "https://api.github.com/repos/purduesigbots/pros-cli/releases/latest"
    );
    releaseVersionNumber = +cliVersion.replace(/\./gi, "") ?? 0;
    toolchainVersion = await getCurrentReleaseVersion(
      "https://api.github.com/repos/purduesigbots/toolchain/releases/latest"
    );
    await prosLogger.log("OneClick", `CLI Version: ${cliVersion}`);
  } catch (e: any) {
    await prosLogger.log("OneClick", "Failed to access version number");
    console.log("Hit the rate limit, please try again after some time.");
    cliVersion = undefined;
  }
  let vexcomVersion = "1_0_0_23";

  if (cliVersion === undefined || toolchainVersion === undefined) {
    throw new Error("Failed to access version number");
  }

  // Get system type, path string separator, CLI download url, and toolchain download url.
  // Default variables are based on linux.
  await prosLogger.log(
    "OneClick",
    "Fetching CLI and Toolchain Download URLs...."
  );
  let [downloadCli, downloadToolchain, downloadVexcom] = await getUrls(
    cliVersion,
    toolchainVersion,
    vexcomVersion
  );
  await prosLogger.log("OneClick", `CLI Download URL: ${downloadCli}`);
  await prosLogger.log(
    "OneClick",
    `Toolchain Download URL: ${downloadToolchain}`
  );
  await prosLogger.log("OneClick", `Vexcom Download URL: ${downloadVexcom}`);

  // Set the installed file names
  var cliName = `pros-cli-${system}.zip`;
  var vexcomName = `vex-vexcom-${system}.zip`;
  var toolchainName = `pros-toolchain-${
    system === "windows" ? `${system}.zip` : `${system}.tar.bz2`
  }`;

  // Verify that the CLI and toolchain are working before prompting user to install.
  await prosLogger.log("OneClick", "Checking Status of CLI and Toolchain....");
  // Check if CLI is working, up to date and installed with OneClick
  let [cliExecPath] = getIntegratedTerminalPaths(context);
  const addQuotes =
    system === "macos" && !os.cpus()[0].model.includes("Apple M");
  let [version, isOneClickInstall] = await getCurrentVersion(
    path.join(
      `${addQuotes ? `"` : ""}${cliExecPath}${addQuotes ? `"` : ""}`,
      "pros"
    )
  );
  const cliWorking = version !== -1;
  const toolchainWorking =
    (await verifyToolchain().catch((err) => {
      prosLogger.log("OneClick", `TOOLCHAIN verification failed with error ${err}`, "ERROR");
      console.error(err);
    })) ?? false;
  const vexcomWorking =
    (await verifyVexcom().catch((err) => {
      prosLogger.log("OneClick", `VEXCOM verification failed with error ${err}`, "ERROR");
      console.error(err);
    })) ?? false;

  //log the result of cli and toolchain working
  await prosLogger.log(
    "OneClick",
    `${
      cliWorking
        ? "CLI appears to be functional"
        : "CLI not functional or not installed"
    }`,
    cliWorking ? "INFO" : "WARNING"
  );
  await prosLogger.log(
    "OneClick",
    `${
      toolchainWorking
        ? "Toolchain appears to be functional"
        : "Toolchain not functional or not installed"
    }`,
    toolchainWorking ? "INFO" : "WARNING"
  );
  await prosLogger.log(
    "OneClick",
    `${
      vexcomWorking
        ? "Vexcom appears to be functional"
        : "Vexcom not functional or not installed"
    }`,
    vexcomWorking ? "INFO" : "WARNING"
  );

  console.log("CLI Working: " + cliWorking);
  console.log("Toolchain Working: " + toolchainWorking);
  console.log("Vexcom Working: " + vexcomWorking);

  // Does the user's CLI have an update or does the user need to install/update
  const cliUpToDate = version >= (releaseVersionNumber ?? 0);
  await prosLogger.log(
    "OneClick",
    `${cliUpToDate ? "CLI is up to date" : "CLI is not up to date"}`,
    cliUpToDate ? "INFO" : "WARNING"
  );
  await prosLogger.log(
    "OneClick",
    `${isOneClickInstall ? "CLI is installed with OneClick" : "CLI is not installed with OneClick"}`,
    "INFO"
  );

  // Last step for this that is unknown is determining if the toolchain is up to date or not.
  // I think that toolchain upates are rare enough where it's not worth the effort to check.
  let promises: Promise<any>[] = [];

  console.log(
    "cliUpToDate: " +
      cliUpToDate +
      " | cliWorking: " +
      cliWorking +
      " | toolchainWorking: " +
      toolchainWorking +
      " | vexcomWorking: " +
      vexcomWorking
  );

  let userResponse = await promptInstall(cliWorking, cliUpToDate, toolchainWorking, vexcomWorking);
  await preparingInstall.stop();

  //if everything works and cli is up to date, do nothing
  if (cliWorking && toolchainWorking && cliUpToDate && vexcomWorking) {
    return;
  }

  // if user rejected install prompt, do nothing
  if (!userResponse) {
    await prosLogger.log("OneClick", "User refused prompt to install.");
    return;
  }

  device.suspend();
  // if CLI is our of date or not working, install the CLI
  if (!cliUpToDate || !cliWorking) {
    let cliDir = vscode.Uri.joinPath(context.globalStorageUri, "install", `pros-cli-${system}`);
    console.log("removing directory " + cliDir.toString());
    await prosLogger.log("OneClick", "removing directory " + cliDir.toString());
    try {
      await vscode.workspace.fs.delete(cliDir, {recursive: true});
    } catch (err: any) {
      await prosLogger.log("OneClick", err, "ERROR");
      console.error(err);
    }
    promises.push(downloadextract(context, downloadCli, cliName, "PROS CLI"));
  }

  if (!toolchainWorking) {
    let toolchainDir = vscode.Uri.joinPath(context.globalStorageUri, "install", `pros-toolchain-${system}`);
    console.log("removing directory " + toolchainDir.toString());
    await prosLogger.log("OneClick", "removing directory " + toolchainDir.toString());
    try {
      await vscode.workspace.fs.delete(toolchainDir, {recursive: true});
    } catch (err: any) {
      await prosLogger.log("OneClick", err, "ERROR");
      console.error(err);
    }
    promises.push(downloadextract(context, downloadToolchain, toolchainName, "PROS Toolchain"));
  }

  if (!vexcomWorking) {
    let vexcomDir = vscode.Uri.joinPath(context.globalStorageUri, "install", `vex-vexcom-${system}`);
    console.log("removing directory " + vexcomDir.toString());
    await prosLogger.log("OneClick", "removing directory " + vexcomDir.toString());
    try {
      await vscode.workspace.fs.delete(vexcomDir, {recursive: true});
    } catch (err: any) {
      await prosLogger.log("OneClick", err, "ERROR");
      console.error(err);
    }
    promises.push(downloadextract(context, downloadVexcom, vexcomName, "Vexcom"));
  }

  //await removeDirAsync(deleteDir, false).catch((e) => {console.log(e);});
  //add install and download directories
  await prosLogger.log("OneClick", "Adding install and download directories");
  console.log("adding install and download directories");
  await createDirs(context.globalStorageUri);

  await prosLogger.log("OneClick", "Downloading and extracting files");
  console.log("Beginning Downloads");
  await Promise.all(promises);
  console.log("Cleanup and Verification");
  await prosLogger.log("OneClick", "Cleaning up after installation");
  await vscode.commands.executeCommand("pros.verify");
  device.unsuspend();

  // Do we want to auto disable install on startup? This will remove the auto update portion of the extension right?
  /*
  vscode.workspace
    .getConfiguration("pros")
    .update("showInstallOnStartup", false);
    */
}

async function promptInstall(cliWorking: boolean, cliUpToDate: boolean, toolchainWorking: boolean, vexcomWorking: boolean) {
  if (cliWorking && cliUpToDate && toolchainWorking && vexcomWorking) {
    vscode.window.showInformationMessage(
      "Everything is currently working and up to date."
    );
    console.log("Everything is up to date");
    await prosLogger.log(
      "OneClick",
      "Everything is currently working and up to date. Nothing else must be done"
    );
    return false;
  }
  let installRequired: string[] = [];
  if (!cliWorking) {
    installRequired.push("CLI");
  }
  if (!toolchainWorking) {
    installRequired.push("Toolchain");
  }
  if (!vexcomWorking) {
    installRequired.push("Vexcom");
  }
  console.log(installRequired.length);
  let prompttitle: string = "";
  if (!cliUpToDate && cliWorking) {
    prompttitle = "PROS CLI is out of date";
    if (installRequired.length === 0) {
      prompttitle += ". Update now?";
    }
  }
  if (installRequired.length !== 0) {
    if (!cliUpToDate && cliWorking) {
      prompttitle += " and ";
    }
    prompttitle += installRequired.join(" and ");
    prompttitle += `${installRequired.length === 1 ? " is" : " are"} not working. Install now?`;
  }
  console.log("Prompting user with: " + prompttitle);
  const affirmative = `${installRequired.length === 0 ? "Update" : "Install"} now!`;
  const labelResponse = await vscode.window.showInformationMessage(
    prompttitle,
    affirmative,
    "No Thanks."
  );
  return labelResponse === affirmative;
}

async function createDirs(storagePath: vscode.Uri) {
  // Create the download and install subdirectories
  const install = vscode.Uri.joinPath(storagePath, "install");
  const download = vscode.Uri.joinPath(storagePath, "download");
  for (const dir of [install, download]) {
    await prosLogger.log("OneClick", `Recursively creating directory ${dir}`);
    await vscode.workspace.fs.createDirectory(dir);
  }
  // Return the two created directories
  return { install: install, download: download };
}

export async function cleanup(
  context: vscode.ExtensionContext,
  system: string = getOperatingSystem()
) {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Verifying Installation",
      cancellable: true,
    },
    async () => {
      try {
        const globalPath = context.globalStorageUri;
        await prosLogger.log(
          "OneClick",
          `Removing temporary download directory`
        );
        try {
          await vscode.workspace.fs.delete(vscode.Uri.joinPath(globalPath, "download"), {recursive: true});
        } catch (err: any) {
          await prosLogger.log("OneClick", err, "ERROR");
          console.error(err);
        }

        await prosLogger.log(
          "OneClick",
          `Verifying that CLI and Toolchain are working`
        );
        await chmod(globalPath.fsPath, system);
        await prosLogger.log("OneClick", `Configuring environment variables`);
        await configurePaths(context).catch((e) => {
          prosLogger.log("OneClick", e, "ERROR");
        });

        // Ensure that toolchain and cli are working
        let cliSuccess =
          (await verifyCli().catch((err) => {
            prosLogger.log("OneClick", err, "ERROR");
          })) ?? false;
        let toolchainSuccess =
          (await verifyToolchain().catch((err) => {
            prosLogger.log("OneClick", err, "ERROR");
          })) ?? false;
        let vexcomSuccess =
          (await verifyVexcom().catch((err) => {
            prosLogger.log("OneClick", err, "ERROR");
          })) ?? false;
        if (cliSuccess && toolchainSuccess && vexcomSuccess) {
          vscode.window.showInformationMessage(
            "CLI and Toolchain are working!"
          );
        } else {
          vscode.window.showErrorMessage(
            `${cliSuccess && vexcomSuccess ? "" : "CLI"}
            ${!cliSuccess && !toolchainSuccess && !vexcomSuccess ? " and " : ""}
            ${toolchainSuccess ? "" : "Toolchain"}
            Installation Failed!`
          );
          vscode.window.showInformationMessage(
            `Please try installing again! If this problem persists, consider trying an alternative install method: https://pros.cs.purdue.edu/v5/getting-started/${system}.html`
          );
        }
      } catch (err: any) {
        vscode.window.showInformationMessage("FATAL ERROR DURING VERIFICATION");
        prosLogger.log("OneClick", err, "ERROR");
      }
    }
  );
}

export async function configurePaths(
  context: vscode.ExtensionContext,
  repeat: boolean = true
) {
  await prosLogger.log("OneClick", "Getting paths for integrated terminal");
  let [cliExecPath, toolchainPath, vexcomPath] =
    getIntegratedTerminalPaths(context);

  // return if the path is already configured
  const addQuotes =
    getOperatingSystem() === "macos" && !os.cpus()[0].model.includes("Apple M");
  // Check if user has CLI installed through one-click or other means.
  await prosLogger.log("OneClick", "Checking How CLI is installed");
  let [version, isOneClickInstall] = await getCurrentVersion(
    path.join(
      `${addQuotes ? `"` : ""}${cliExecPath}${addQuotes ? `"` : ""}`,
      "pros"
    )
  );
  process.env["PROS_VSCODE_FLAGS"] =
    version >= 324 ? "--no-sentry --no-analytics" : "";
  await prosLogger.log(
    "OneClick",
    `CLI is installed through ${
      isOneClickInstall ? "one-click" : "other means"
    } with version ${version}`
  );
  console.log(`${isOneClickInstall} | ${version}`);

  PATH_SEP = getOperatingSystem() === "windows" ? ";" : ":";

  if (PATH_SEP === ":") {
    cliExecPath = cliExecPath.replace(/\\/g, "");
    toolchainPath = toolchainPath.replace(/\\/g, "");
    vexcomPath = vexcomPath.replace(/\\/g, "");
  }
  TOOLCHAIN = process.env["PROS_TOOLCHAIN"] ?? toolchainPath;
  // Set CLI environmental variable file location
  CLI_EXEC_PATH = cliExecPath;

  let pathCliCount: number =
    process.env["PATH"]?.split(PATH_SEP).filter((x) => x.includes(cliExecPath))
      .length ?? 0;
  let pathToolchainCount: number =
    process.env["PATH"]
      ?.split(PATH_SEP)
      .filter((x) => x.includes(toolchainPath)).length ?? 0;
  let pathVexcomCount: number =
    process.env["PATH"]?.split(PATH_SEP).filter((x) => x.includes(vexcomPath))
      .length ?? 0;

  prosLogger.log("OneClick", `CLI path count: ${pathCliCount}`);
  prosLogger.log("OneClick", `Toolchain path count: ${pathToolchainCount}`);
  prosLogger.log("OneClick", `Vexcom path count: ${pathVexcomCount}`);
  console.log(`CLI path count: ${pathCliCount}`);
  console.log(`Toolchain path count: ${pathToolchainCount}`);
  console.log(`Vexcom path count: ${pathVexcomCount}`);
  if (
    pathCliCount > 2 &&
    pathToolchainCount > 2 &&
    pathVexcomCount > 2 &&
    process.env["PROS_TOOLCHAIN"]?.includes(TOOLCHAIN)
  ) {
    console.log("path already configured");
    await prosLogger.log("OneClick", "PATH is already configured");
    return;
  }
  // Prepend CLI and TOOLCHAIN to path
  await prosLogger.log("OneClick", "Appending CLI and TOOLCHAIN to PATH");
  await prosLogger.log("OneClick", `CLI Executable Path: ${cliExecPath}`);
  process.env.PATH = `${process.env.PATH}`; // bypass compile errors
  await prosLogger.log("OneClick", process.env.PATH ?? "no PATH", "INFO");
  process.env.PATH =
    `${cliExecPath}${PATH_SEP}` +
    `${path.join(toolchainPath, "bin")}${PATH_SEP}` +
    `${vexcomPath}${PATH_SEP}` +
    `${process.env.PATH.replace(/\"/g, "")}`;
  await prosLogger.log("OneClick", process.env.PATH ?? "no PATH", "INFO");
  // Make PROS_TOOLCHAIN variable
  await prosLogger.log("OneClick", "Setting PROS_TOOLCHAIN");
  process.env.PROS_TOOLCHAIN = TOOLCHAIN;
  await prosLogger.log("OneClick", "PROS_TOOLCHAIN: " + process.env.PROS_TOOLCHAIN, "INFO");

  process.env.LC_ALL = "en_US.utf-8";
  if (repeat) {
    configurePaths(context, false); // recursive call to ensure that the path is configured. This is necessary because Macs are stupid and need the PATH updated twice for some reason.
  }
}

async function verifyCli() {
  var command = `pros c --help --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
  await prosLogger.log("OneClick", `Verifying CLI with command ${command}`);
  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    timeout: 30000,
    env: {
      ...process.env,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      PATH: getChildProcessPath(),
    },
  });
  if (stderr) {
    await prosLogger.log(
      "OneClick",
      `CLI verification failed with error ${stderr}`,
      "error"
    );
    console.error(stderr);
  }
  return stdout.includes(
    `Uc&42BWAaQ{"type": "log/message", "level": "DEBUG", "message": "DEBUG - pros:callback - CLI Version:`
  );
}

async function verifyToolchain() {
  await prosLogger.log("OneClick", "Verifying TOOLCHAIN");

  let toolchainPath = getChildProcessProsToolchainPath() ?? "";
  if (!toolchainPath) {
    await prosLogger.log("OneClick", "No valid toolchain path found", "error");
    return false;
  }

  await prosLogger.log("OneClick", `Using toolchain path ${toolchainPath}`);

  let command = `"${path.join(
    toolchainPath,
    "bin",
    "arm-none-eabi-g++"
  )}" --version`;
  console.log(command);
  await prosLogger.log(
    "OneClick",
    `Verifying TOOLCHAIN with command ${command}`
  );

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
      `TOOLCHAIN verification failed with error ${stderr}`,
      "error"
    );
    console.error(stderr);
  }
  return stdout.replace(".exe", "").startsWith(`arm-none-eabi-g++ (G`);
}

async function verifyVexcom() {
  await prosLogger.log("OneClick", "Verifying VEXCOM");
  var command = "vexcom --version";

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
    console.error(stderr);
  }
  return stdout.replace(".exe", "").startsWith("vexcom: version");
}

export async function installVision(context: vscode.ExtensionContext) {
  const globalPath = context.globalStorageUri.fsPath;
  const system = getOperatingSystem();
  const windowsVision =
    "https://github.com/purduesigbots/pros-cli/releases/download/3.4.1/vision_030_win32.zip";
  const macosVision =
    "https://github.com/purduesigbots/pros-cli/releases/download/3.4.1/vision_030_osx64.zip";

  // Set the installed file names
  var visionName = `pros-vision-${system}.zip`;
  if (system === "windows") {
    console.log("vision utility on windows");
    //add install and download directories
    const dirs = await createDirs(context.globalStorageUri);

    const promises = [
      downloadextract(context, windowsVision, visionName, "Vision Utility"),
    ];

    await Promise.all(promises);
    console.log("cleanup time");
    await cleanup(context, system);
  } else if (system === "macos") {
    vscode.window.showInformationMessage(
      "Vision Utility is currently not supported on MacOS. We are currently working on fixing this."
    );
    return;
    //add install and download directories
    const dirs = await createDirs(context.globalStorageUri);

    const promises = [
      downloadextract(context, macosVision, visionName, "Vision Utility"),
    ];

    await Promise.all(promises);
    await fs.promises.chmod(
      `${path.join(
        globalPath,
        "install",
        `pros-vision-${system}`,
        "osx64",
        "Vision Utility.app",
        "Contents",
        "MacOS",
        "nwjs"
      )}`,
      0o751
    ),
      await cleanup(context, system);
  } else if (system === "linux") {
    vscode.window.showInformationMessage(
      "Vision Utility is not supported on Linux"
    );
    return;
  }
  vscode.workspace
    .getConfiguration("pros")
    .update("showInstallOnStartup", false);

  vscode.window.showInformationMessage("Vision Utility Installed!");
}

export async function uninstallVision(context: vscode.ExtensionContext) {
  const globalPath = context.globalStorageUri.fsPath;
  const title = "Are you sure you want to uninstall the Vision Utlity?";
  const labelResponse = await vscode.window.showInformationMessage(
    title,
    "Uninstall Now!",
    "No Thanks."
  );
  if (labelResponse === "Uninstall Now!") {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Uninstalling Vision Utility",
        cancellable: false,
      },
      async () => {
        const removePath = path.join(
          globalPath,
          "install",
          `pros-vision-${getOperatingSystem()}`
        );
        console.log(removePath);
        await removeDirAsync(removePath, false);
      }
    );
    vscode.window.showInformationMessage("Vision Utility Uninstalled!");
  }
}
