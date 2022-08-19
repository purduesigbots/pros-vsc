import * as vscode from "vscode";

import * as path from "path";
import * as os from "os";
import { downloadextract, chmod } from "./download";
import {
  getCurrentVersion,
  getCurrentReleaseVersion,
  getInstallPromptTitle,
} from "./installed";
import * as fs from "fs";
import { promisify } from "util";
import * as child_process from "child_process";
import { URL } from "url";
import { getChildProcessPath, getIntegratedTerminalPaths, getChildProcessProsToolchainPath } from "./path";


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
        title:
          "Cleaning Directory",
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
      async (progress, token) => {
        await removeDirAsync(globalPath, false);
      }
    );
    vscode.window.showInformationMessage("PROS Uninstalled!");
  }
}

async function getUrls(cliVersion: number, toolchainVersion: string) {
  var downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-lin-64bit.zip`;
  var downloadToolchain =
    "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2";

  if (getOperatingSystem() === "windows") {
    // Set system, path seperator, and downloads to windows version
    downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-win-64bit.zip`;
    downloadToolchain =
    `https://github.com/purduesigbots/toolchain/releases/download/${toolchainVersion}/pros-toolchain-windows.zip`;
  } else if (getOperatingSystem() === "macos") {
    // Set system, path seperator, and downloads to windows version
    downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-macos-64bit.zip`;
    downloadToolchain =
      "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2";
    os.cpus().some((cpu) => {
      if (cpu.model.includes("Apple M")) {
        downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${cliVersion}/pros_cli-${cliVersion}-macos-arm64bit.zip`;
      }
    });
  }

  const custom_cli = vscode.workspace.getConfiguration("pros").get<string>("OneClick: CliDownloadURL")??"default";
  const custom_toolchain = vscode.workspace.getConfiguration("pros").get<string>("OneClick: ToolchainDownloadURL")??"default";
  console.log(`Custom URLS: ${custom_cli} | ${custom_toolchain}`);
  if(custom_cli !== "default"){
    try {
      const cliurl = new URL(custom_cli);
      downloadCli = custom_cli === "default" ? downloadCli : custom_cli;
    } catch(e: any) {
      //console.log(e);
      console.log("CLI Url specified in PROS extension settings was invalid. Using default instead");
    }
  }

  if(custom_toolchain !== "default"){
    try {
      const toolchainurl = new URL(custom_toolchain);
      downloadToolchain = custom_toolchain === "default" ? downloadToolchain : custom_toolchain;
    } catch(e: any) {
      //console.log(e);
      console.log("Toolchain Url specified in PROS extension settings was invalid. Using default instead");
    }
  }



  return [downloadCli, downloadToolchain];
}

export async function install(context: vscode.ExtensionContext) {
  await configurePaths(context);
  const globalPath = context.globalStorageUri.fsPath;
  const system = getOperatingSystem();
  var cliVersion = (await getCurrentReleaseVersion(
    "https://api.github.com/repos/purduesigbots/pros-cli/releases/latest"
  ));
  console.log(cliVersion);
  let release_version_number = +cliVersion.replace(/\./gi,'') ?? 0;
  const toolchainVersion = await getCurrentReleaseVersion(
    "https://api.github.com/repos/purduesigbots/toolchain/releases/latest"
  )
  console.log("Latest Available CLI Version: " + release_version_number);

  // Get system type, path string separator, CLI download url, and toolchain download url.
  // Default variables are based on linux.
  let [downloadCli, downloadToolchain] = await getUrls(cliVersion, toolchainVersion);
  // Set the installed file names
  var cliName = `pros-cli-${system}.zip`;
  // Title of prompt depending on user's installed CLI
  var title = await getInstallPromptTitle(
    path.join(
      `"${path.join(globalPath, "install", `pros-cli-${system}`)}"`,
      "pros"
    ), release_version_number ?? 0
  );
  console.log(title);
  // Verify that the CLI and toolchain are working before prompting user to install.
  const cliWorking = await verifyCli().catch((err) => {console.log(err)})??false;
  const toolchainWorking = await verifyToolchain().catch((err) => {console.log(err)})??false;

  console.log("CLI Working: " + cliWorking);
  console.log("Toolchain Working: " + toolchainWorking);
  // Name of toolchain download depending on system
  var toolchainName = `pros-toolchain-${
    system === "windows" ? `${system}.zip` : `${system}.tar.bz2`
  }`;

  // Does the user's CLI have an update or does the user need to install/update
  const cliUpToDate = title.includes("up to date") ? true : false;

  // Last step for this that is unknown is determining if the toolchain is up to date or not.
  // I think that toolchain upates are rare enough where it's not worth the effort to check.
  

  let promises: Promise<any>[] = [];
  let targeted_portion: string = "";


  //if everything works and cli is up to date, do nothing
  if (cliWorking && toolchainWorking && cliUpToDate) {
    // tell the user that everything is up to date
    vscode.window.showInformationMessage(
      "CLI and Toolchain currently working and up to date."
    );
    return;
  }

  // if CLI is up to date but toolchain is not working, install just the toolchain
  else if (cliUpToDate && cliWorking && !toolchainWorking) {
    const prompttitle = "PROS Toolchain is not working. Install now?";
    const labelResponse = await vscode.window.showInformationMessage(
      prompttitle,
      "Install Now!",
      "No Thanks."
    );
    if (labelResponse === "Install Now!") {
      targeted_portion = path.join("install", `pros-toolchain-${system}`);
      let delete_dir = path.join(context.globalStorageUri.fsPath, targeted_portion)
      console.log("removing directory " + delete_dir);
      await removeDirAsync(delete_dir, true).catch((e) => {console.log(e);});

      promises = [downloadextract(context, downloadToolchain, toolchainName)];
    } else {
      return;
    }
    // if the toolchain is working but the cli is not working or out of date, install just the cli

  } else if (toolchainWorking && !(cliWorking && cliUpToDate)) {
    const prompttitle = `PROS CLI is ${cliWorking ? "out of date. Update" : "not working. Install"} now?`;
    const option1 = `${cliWorking ? "Update" : "Install"} Now!`;
    const labelResponse = await vscode.window.showInformationMessage(
      prompttitle,
      option1,
      "No Thanks."
    );
    if (labelResponse === option1) {
      targeted_portion = path.join("install", `pros-cli-${system}}`);
      let delete_dir = path.join(context.globalStorageUri.fsPath, targeted_portion)
      console.log("removing directory " + delete_dir);
      await removeDirAsync(delete_dir, true).catch((e) => {console.log(e);});

      promises = [downloadextract(context, downloadCli, cliName)];
    } else {
      return;
    }

  // if neither the cli or toolchain is working
  } else if (!cliWorking && !toolchainWorking) {
    const prompttitle = "PROS CLI and Toolchain are not working. Install now?";
    const labelResponse = await vscode.window.showInformationMessage(
      prompttitle,
      "Install Now!",
      "No Thanks."

    );
    if (labelResponse === "Install Now!") {
      await removeDirAsync(context.globalStorageUri.fsPath, true).catch((e) => {console.log(e);});
      promises = [
        downloadextract(context, downloadCli, cliName),
        downloadextract(context, downloadToolchain, toolchainName),
      ];
    } else {
      return;
    }
  }


  let delete_dir = path.join(context.globalStorageUri.fsPath, targeted_portion)
  console.log("removing directory " + delete_dir);

  await removeDirAsync(delete_dir, false).catch((e) => {console.log(e);});
  //add install and download directories
  const dirs = await createDirs(context.globalStorageUri.fsPath);

  await Promise.all(promises);
  await cleanup(context, system);



  // Do we want to auto disable install on startup? This will remove the auto update portion of the extension right?
  /*
  vscode.workspace
    .getConfiguration("pros")
    .update("showInstallOnStartup", false);
    */
}

async function createDirs(storagePath: string) {
  // Create the download and install subdirectories
  const install = path.join(storagePath, "install");
  const download = path.join(storagePath, "download");
  for (const dir of [install, download]) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  // Return the two created directories
  return { install: install, download: download };
}

export async function cleanup(
  context: vscode.ExtensionContext,
  system: string = getOperatingSystem()
) {
  const globalPath = context.globalStorageUri.fsPath;
  await removeDirAsync(path.join(globalPath, 'download'), false);
  await configurePaths(context);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Verifying Installation",
      cancellable: true,
    },
    async (progress, token) => {
      try {
        await chmod(globalPath, system);
        await configurePaths(context);

        // Ensure that toolchain and cli are working
        let cliSuccess = await verifyCli().catch((err) => {})??false;
        let toolchainSuccess = await verifyToolchain().catch((err) => {console.log(err);})??false;
        if (cliSuccess && toolchainSuccess) {
          vscode.window.showInformationMessage(
            "CLI and Toolchain are working!"
          );
        } else {
          vscode.window.showErrorMessage(
            `${cliSuccess ? "" : "CLI"} 
            ${!cliSuccess && !toolchainSuccess ? " and " : ""} 
            ${toolchainSuccess ? "" : "Toolchain"} 
            Installation Failed!`
          );
          vscode.window.showInformationMessage(
            `Please try installing again! If this problem persists, consider trying an alternative install method: https://pros.cs.purdue.edu/v5/getting-started/${system}.html`
          );
        }
      } catch (err) {
        vscode.window.showInformationMessage("ERROR DURING VERIFICATION");
        console.log(err);
      }
    }
  );
}

export async function configurePaths(context: vscode.ExtensionContext) {
  const [cliExecPath, toolchainPath] = getIntegratedTerminalPaths(context);

  // return if the path is already configured

  const addQuotes = !(
    getOperatingSystem() === "macos" && !os.cpus()[0].model.includes("Apple M")
  );
  // Check if user has CLI installed through one-click or other means.
  let [version, isOneClickInstall] = await getCurrentVersion(
    path.join(
      `${addQuotes ? `"` : ""}${cliExecPath}${addQuotes ? `"` : ""}`,
      "pros"
    )
  );
  process.env["PROS_VSCODE_FLAGS"] =
    version >= 324 ? "--no-sentry --no-analytics" : "";
  console.log(`${isOneClickInstall} | ${version}`);

  PATH_SEP = getOperatingSystem() === "windows" ? ";" : ":";

  TOOLCHAIN = process.env["PROS_TOOLCHAIN"] ?? toolchainPath;
  // Set CLI environmental variable file location
  CLI_EXEC_PATH = cliExecPath;

  if (
    process.env["PATH"]?.includes(cliExecPath) &&
    process.env["PROS_TOOLCHAIN"]?.includes(TOOLCHAIN)
  ) {
    console.log("path already configured");
    return;
  }
  // Prepend CLI and TOOLCHAIN to path
  process.env["PATH"] = `${cliExecPath}${PATH_SEP}${path.join(toolchainPath, "bin")}${PATH_SEP}${process.env["PATH"]}`;

  // Make PROS_TOOCLHAIN variable
  process.env["PROS_TOOLCHAIN"] = `${TOOLCHAIN}`;

  process.env.LC_ALL = "en_US.utf-8";
}

async function verifyCli() {
  var command = `pros c --help --machine-output ${process.env["PROS_VSCODE_FLAGS"]}`;
  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    timeout: 30000,
    env: {
      ...process.env,
      PATH: getChildProcessPath(),
    },
  });
  if (stderr) {
    console.log(stderr);
  }
  //console.log(stdout);
  return stdout.includes(`Uc&42BWAaQ{"type": "log/message", "level": "DEBUG", "message": "DEBUG - pros:callback - CLI Version:`);
}

async function verifyToolchain() {
  let toolchainPath = getChildProcessProsToolchainPath()??'';
  if (!toolchainPath) {
    return false;
  }

  var command = `"${path.join(
    toolchainPath,
    "bin",
    "arm-none-eabi-g++"
  )}" --version`;

  const { stdout, stderr } = await promisify(child_process.exec)("arm-none-eabi-g++ --version", {
    timeout: 5000,
    env: {
      ...process.env,
      PATH: getChildProcessPath(),
    },
  });
  if (stderr) {
    console.log(stderr);
  }
  return stdout.replace(".exe","").startsWith(`arm-none-eabi-g++ (G`);
}
