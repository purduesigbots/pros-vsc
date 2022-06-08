import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { downloadextract, chmod } from "./download";
import {
  getCurrentVersion,
  getCliVersion,
  getInstallPromptTitle,
} from "./installed";
import * as fs from "fs";
import { promisify } from "util";
import * as child_process from "child_process";
import { ClientRequest } from "http";

//TOOLCHAIN and CLI_EXEC_PATH are exported and used for running commands.
export var TOOLCHAIN: string;
export var CLI_EXEC_PATH: string;
export var PATH_SEP: string;

const getOperatingSystem = () => {
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
    vscode.window.showInformationMessage("Clearing directory");
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

async function getUrls(version: number) {
  var downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-lin-64bit.zip`;
  var downloadToolchain =
    "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2";

  if (getOperatingSystem() === "windows") {
    // Set system, path seperator, and downloads to windows version
    downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-win-64bit.zip`;
    downloadToolchain =
      "https://artprodcus3.artifacts.visualstudio.com/A268c8aad-3bb0-47d2-9a57-cf06a843d2e8/3a3f509b-ad80-4d2a-8bba-174ad5fd1dde/_apis/artifact/cGlwZWxpbmVhcnRpZmFjdDovL3B1cmR1ZS1hY20tc2lnYm90cy9wcm9qZWN0SWQvM2EzZjUwOWItYWQ4MC00ZDJhLThiYmEtMTc0YWQ1ZmQxZGRlL2J1aWxkSWQvMjg4Ni9hcnRpZmFjdE5hbWUvdG9vbGNoYWluLTY0Yml00/content?format=file&subPath=%2Fpros-toolchain-w64-3.0.1-standalone.zip";
  } else if (getOperatingSystem() === "macos") {
    // Set system, path seperator, and downloads to windows version
    downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-macos-64bit.zip`;
    downloadToolchain =
      "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2";
    os.cpus().some((cpu) => {
      if (cpu.model.includes("Apple M1")) {
        downloadCli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-macos-arm64bit.zip`;
      }
    });
  }

  return [downloadCli, downloadToolchain];
}

export async function install(context: vscode.ExtensionContext) {
  const globalPath = context.globalStorageUri.fsPath;
  const system = getOperatingSystem();
  var version = await getCliVersion(
    "https://api.github.com/repos/purduesigbots/pros-cli/releases/latest"
  );
  console.log("Latest Available CLI Version: " + version);

  // Get system type, path string separator, CLI download url, and toolchain download url.
  // Default variables are based on linux.
  let [downloadCli, downloadToolchain] = await getUrls(version);
  // Set the installed file names
  var cliName = `pros-cli-${system}.zip`;
  // Title of prompt depending on user's installed CLI
  var title = await getInstallPromptTitle(
    path.join(`"${path.join(globalPath, "install", `pros-cli-${system}`)}"`,"pros")
  );
  // Name of toolchain download depending on system
  var toolchainName = `pros-toolchain-${
    system === "windows" ? `${system}.zip` : `${system}.tar.bz2`
  }`;
  // Does the user's CLI have an update or does the user need to install/update
  const cliVersion = title.includes("up to date") ? "UTD" : null;
  if (cliVersion === null) {
    // Ask user to install CLI if it is not installed.
    const labelResponse = await vscode.window.showInformationMessage(
      title,
      "Install it now!",
      "No Thanks."
    );


    if (labelResponse === "Install it now!") {
      // Install CLI if user chooses to.

      //delete the directory

      try {
        await removeDirAsync(context.globalStorageUri.fsPath, false);
      } catch (err) {
        console.log(err);
      }
      //add install and download directories
      const dirs = await createDirs(context.globalStorageUri.fsPath);

      const promises = [
        downloadextract(context, downloadCli, cliName),
        downloadextract(context, downloadToolchain, toolchainName),
      ];

      await Promise.all(promises);
      await cleanup(context, system);

      vscode.workspace
        .getConfiguration("pros")
        .update("showInstallOnStartup", false);
    } else {
      vscode.workspace
        .getConfiguration("pros")
        .update("showInstallOnStartup", false);
    }
  } else {
    // User already has the CLI installed
    vscode.window.showInformationMessage(title);
    vscode.workspace
      .getConfiguration("pros")
      .update("showInstallOnStartup", false);
  }
}

export async function updateCLI(
  context: vscode.ExtensionContext,
  force = false
) {
  const globalPath = context.globalStorageUri.fsPath;
  const system = getOperatingSystem();

  if (!force) {
    var title = await getInstallPromptTitle(
      path.join(globalPath, "install", `pros-cli-${system}`, "pros")
    );
    if (title.includes("up to date")) {
      vscode.window.showInformationMessage(title);
      return;
    }
    if (title.includes("not")) {
      await install(context);
      return;
    }
    const labelResponse = await vscode.window.showInformationMessage(
      title,
      "Update Now!",
      "No Thanks."
    );

    if (labelResponse?.toLowerCase().includes("no thanks")) {
      return;
    }
  }
  try {
    await removeDirAsync(
      path.join(globalPath, "install", `pros-cli-${system}`),
      false
    );
  } catch (err) {
    console.log(err);
  }
  var version = await getCliVersion(
    "https://api.github.com/repos/purduesigbots/pros-cli/releases/latest"
  );
  let [downloadCli, downloadToolchain] = await getUrls(version);
  // Set the installed file names
  var cliName = `pros-cli-${system}.zip`;
  // Title of prompt depending on user's installed CLI
  await downloadextract(context, downloadCli, cliName);
  await cleanup(context, system);
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
        const cliSuccess = await verifyCli();
        const toolchainSuccess = await verifyToolchain();
        if (cliSuccess && toolchainSuccess) {
          vscode.window.showInformationMessage(
            "CLI and Toolchain are working!"
          );
        } else {
          vscode.window.showErrorMessage(
            `${cliSuccess ? "" : "CLI"} ${
              !cliSuccess && !toolchainSuccess ? "" : "and"
            } ${toolchainSuccess ? "" : "Toolchain"} Installation Failed!`
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
  const globalPath = context.globalStorageUri.fsPath;
  const system = getOperatingSystem();


  // path to cli
  let cliExecPath = `${path.join(globalPath, "install", `pros-cli-${system}`)}`;


  // path to toolchain
  let toolchainPath = path.join(
    globalPath,
    "install",
    `pros-toolchain-${
      system === "windows" ? path.join("windows", "usr") : system
    }`,
    "bin"
  );

  // return if the path is already configured
  if(process.env["PATH"]?.includes(cliExecPath) &&
  process.env["PROS_TOOLCHAIN"]?.includes(toolchainPath)) {
    console.log("path already configured");
    return;
  }

  // Check if user has CLI installed through one-click or other means.
  let [version, isOneClickInstall] = await getCurrentVersion(
    path.join(`"${cliExecPath}"`, "pros")
  );
  process.env["VSCODE FLAGS"] =
    version >= 324 ? "--no-sentry --no-analytics" : "";

  if (!isOneClickInstall) {
    // Use system defaults if user does not have one-click CLI
    CLI_EXEC_PATH = "";
    TOOLCHAIN = "LOCAL";
    return;
  }

  PATH_SEP = system === "windows" ? ";" : ":";

  TOOLCHAIN = toolchainPath;
  // Set CLI environmental variable file location
  CLI_EXEC_PATH = cliExecPath;

   // Prepend CLI and TOOLCHAIN to path
  process.env["PATH"] = `${process.env["PATH"]}${PATH_SEP}${cliExecPath}${PATH_SEP}${toolchainPath}`;

  // Make PROS_TOOCLAHIN variable
  process.env["PROS_TOOLCHAIN"] = `${TOOLCHAIN}`;

  process.env.LC_ALL = "en_US.utf-8";
}

async function verifyCli() {
  var command = `pros c ls-templates --machine-output ${process.env["VSCODE FLAGS"]}`;
  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    timeout: 30000,
  });
  if (stderr) {
    console.log(stderr);
  }
  return stdout.includes(`'kernel', 'version': '3.5.4'`);
}

async function verifyToolchain() {
  const toolchain_path = process.env["PROS_TOOLCHAIN"];
  if (!toolchain_path) {
    return false;
  }

  var command = `arm-none-eabi-g++ --version`;

  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    timeout: 5000,
  });
  if (stderr) {
    console.log(stderr);
  }
  return stdout.startsWith(`arm-none-eabi-g++ (GNU Arm Embedded Toolchain`);
}
