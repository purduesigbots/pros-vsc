import * as vscode from "vscode";
import * as path from 'path';
import * as os from 'os';
import { download } from './download';
import { promisify } from 'util';
import * as fs from 'fs';
var fetch = require('node-fetch');

//TOOLCHAIN and CLI_EXEC_PATH are exported and used for running commands.
export var TOOLCHAIN: string;
export var CLI_EXEC_PATH: string;
export var PATH_SEP: string;
/*

Code that maybe works to wait for both toolchain and cli to be installed???
a and b arguments are arrays in the format:
{download_url, download_name, system_type}

async function download_cli_and_toolchain(context:vscode.ExtensionContext,a:string[],b:string[]) {
download(context,a[0],a[1],a[2]);
await promisify(download)(context,b[0],b[1],b[2]);
return true;
}
*/

async function remove_dir_async(directory : string, begin : boolean) {
    // get all files in directory
    if(begin) {
        vscode.window.showInformationMessage("Clearing directory");
    }
    const files = await fs.promises.readdir(directory);
    if(files.length > 0) {
        // iterate through found files and directory
        for(const file of files) {
            if((await fs.promises.lstat(path.join(directory,file))).isDirectory()) {
                // if the file is found to be a directory,
                // recursively call this function to remove subdirectory
                await remove_dir_async(path.join(directory,file),false);
            } else {
                //delete the file
                await fs.promises.unlink(path.join(directory,file));
            }
        }
    }
    // delete the directory now that it is empty.
    await fs.promises.rmdir(directory, {recursive:true,maxRetries:20});
    return true;
}

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
        // Set system, path seperator, and downloads to windows version 
        system = "windows";
        PATH_SEP = ";";
        download_cli = `https://github.com/purduesigbots/pros-cli/releases/download/${version}/pros_cli-${version}-win-64bit.zip`;
        download_toolchain = "https://artprodcus3.artifacts.visualstudio.com/A268c8aad-3bb0-47d2-9a57-cf06a843d2e8/3a3f509b-ad80-4d2a-8bba-174ad5fd1dde/_apis/artifact/cGlwZWxpbmVhcnRpZmFjdDovL3B1cmR1ZS1hY20tc2lnYm90cy9wcm9qZWN0SWQvM2EzZjUwOWItYWQ4MC00ZDJhLThiYmEtMTc0YWQ1ZmQxZGRlL2J1aWxkSWQvMjg4Ni9hcnRpZmFjdE5hbWUvdG9vbGNoYWluLTY0Yml00/content?format=file&subPath=%2Fpros-toolchain-w64-3.0.1-standalone.zip";
    } else if (process.platform === "darwin") {
        // Set system, path seperator, and downloads to windows version 
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
            
            await remove_dir_async(context.globalStorageUri.fsPath,true);
            
            //add install and download directories
            const dirs = await createDirs(context.globalStorageUri.fsPath);
            
            /*
            Code to potentially wait for the cli and toolchain to be downloaded.

            const cli_info = [download_cli,cli_name,system];
            const toolchain_info = [download_toolchain,toolchain_name,system];
            await download_cli_and_toolchain(context,cli_info,toolchain_info);
            */

            download(context,download_cli,cli_name,system);
            download(context,download_toolchain,toolchain_name,system);

            // Delete the download subdirectory once everything is installed

            //await remove_dir_async(dirs.download,false);
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
    // (path.join(globalPath, "install", `pros-cli-${system}`));
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
    // Fetch the url
    const response = await fetch(url);
    if (!response.ok) {
        console.log(response.url, response.status, response.statusText);
        throw new Error(`Can't fetch release: ${response.statusText}`);
    }
    // Get the version number from the returned json
    var v_string = (await response.json()).tag_name;
    return v_string;
}

async function createDirs(storagePath: string) {
    // Create the download and install subdirectories
    const install = path.join(storagePath, 'install');
    const download = path.join(storagePath, 'download');
    for (const dir of [install, download]) {
        await fs.promises.mkdir(dir, { 'recursive': true });
    }
    // Return the two created directories
    return { install: install, download: download };
}

