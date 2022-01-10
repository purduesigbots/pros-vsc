import * as vscode from "vscode";
import * as path from 'path';
import * as os from 'os';
import { download } from './download';
import * as fs from 'fs';
var fetch = require('node-fetch');

//TOOLCHAIN and CLI_EXEC_PATH are exported and used for running commands.
export var TOOLCHAIN: string;
export var CLI_EXEC_PATH: string;
export var PATH_SEP: string;
export async function install(context: vscode.ExtensionContext) {
    const globalPath = context.globalStorageUri.fsPath;
    var cliVersion = null;
    var version = await getCliVersion('https://api.github.com/repos/purduesigbots/pros-cli/releases/latest');
    console.log("Current CLI Version: " + version);

    // Get system type, path string separator, CLI download url, and toolchain download url.
    // Default variables are based on linux.
    var download_cli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-lin-64bit.zip`;
    var download_toolchain = "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2";
    var system = "linux";
    PATH_SEP = ":";
    if (process.platform === "win32") {
        system = "windows";
        PATH_SEP = ";";
        download_cli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-win-64bit.zip`;
        download_toolchain = "https://artprodcus3.artifacts.visualstudio.com/A268c8aad-3bb0-47d2-9a57-cf06a843d2e8/3a3f509b-ad80-4d2a-8bba-174ad5fd1dde/_apis/artifact/cGlwZWxpbmVhcnRpZmFjdDovL3B1cmR1ZS1hY20tc2lnYm90cy9wcm9qZWN0SWQvM2EzZjUwOWItYWQ4MC00ZDJhLThiYmEtMTc0YWQ1ZmQxZGRlL2J1aWxkSWQvMjg4Ni9hcnRpZmFjdE5hbWUvdG9vbGNoYWluLTY0Yml00/content?format=file&subPath=%2Fpros-toolchain-w64-3.0.1-standalone.zip";
    } else if (process.platform === "darwin") {
        system = "macos";
        download_cli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-macos-64bit.zip`;
        download_toolchain = "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2";
        os.cpus().some(cpu => {
            if (cpu.model.includes("Apple M1")) {
                download_cli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-macos-arm64bit.zip`;
            }
        });
    }

    // Set the installed file names
    var cli_name = `pros-cli-${system}.zip`;
    var toolchain_name = `pros-toolchain-${system === "windows" ? `${system}.zip` : `${system}.tar.bz2`}`;
    if (cliVersion === null) {
        // Ask user to install CLI if it is not installed.
        const labelResponse = await vscode.window.showQuickPick(
            [{ label: "Install it now!", description: "recommended" }, { label: "No I am good" }],
            {
                placeHolder: "Install it now!",
                canPickMany: false,
                title: "You do not have the PROS CLI installed",
            }
        );
        if (labelResponse!.label === "Install it now!") {
            // Install CLI if user chooses to.

            //delete the directory
            
            //const returned = await fs.promises.rmdir(context.globalStorageUri.fsPath, { recursive: true });

            //add install and download directories
            const dirs = await createDirs(context.globalStorageUri.fsPath);
            var response = null;
            download(context, download_cli, cli_name, system);
            download(context, download_toolchain, toolchain_name, system);
            //delete the download directory

            //const clean = await fs.promises.rmdir(dirs.download, { recursive: true });
        } else {
            vscode.window.showInformationMessage("Install it later!");
        }
    } else {
        // User already has the CLI installed
        vscode.window.showInformationMessage("PROS CLI is already Installed!");
    }
    // Set path variables to toolchain and CLI
    paths(globalPath, system);
}

export function paths(globalPath: string, system: string) {
    console.log(path.join(globalPath, "install", `pros-cli-${system}`));
    // Check if user has CLI installed through one-click or other means.
    var one_clicked = fs.existsSync(path.join(globalPath, "install", `pros-cli-${system}`));

    if (!one_clicked) {
        // Use system defaults if user does not have one-click CLI
        CLI_EXEC_PATH = "pros";
        TOOLCHAIN = "LOCAL"
    } else {
        // Set toolchain environmental variable file location
        TOOLCHAIN = path.join(globalPath, "install", `pros-toolchain-${system === "windows" ? path.join("windows", "usr") : system}`);
        // Set CLI environmental variable file location
        CLI_EXEC_PATH = path.join(globalPath, "install", `pros-cli-${system}`);
    }
}
/*

Code Implemented from clangd source code

*/
async function getCliVersion(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        console.log(response.url, response.status, response.statusText);
        throw new Error(`Can't fetch release: ${response.statusText}`);
    }
    var v_string = (await response.json()).tag_name;
    return v_string;
}

async function createDirs(storagePath: string) {
    const install = path.join(storagePath, 'install');
    const download = path.join(storagePath, 'download');
    for (const dir of [install, download]) {
        await fs.promises.mkdir(dir, { 'recursive': true });
    }
    return { install: install, download: download };
}

