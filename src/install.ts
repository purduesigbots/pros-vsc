import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";
import * as stream from 'stream';
//import fetch from 'node-fetch';
//import * as unzipper from 'unzipper';
var fetch = require('node-fetch');
var unzipper = require('unzipper');
import { getVersion } from '@purduesigbots/pros-cli-middleware';
import { window, ProgressLocation } from 'vscode';
//import { glob } from "glob";
//import { version } from "process";
var Bunzip = require('seek-bzip');
var tar = require('tar-fs');

//TOOLCHAIN and CLI_EXEC_PATH are exported and used for running commands.

export var TOOLCHAIN: string;
export var CLI_EXEC_PATH: string;
export async function install(context: vscode.ExtensionContext) {
    const globalPath = context.globalStorageUri.fsPath;
    var cliVersion = null;
    //cliVersion = await getVersion();
    var version = await getCliVersion('https://api.github.com/repos/purduesigbots/pros-cli/releases/latest');
    console.log("Current CLI Version: " + version);

    if (cliVersion === null) {
        const labelResponse = await vscode.window.showQuickPick(
            [{ label: "Install it now!", description: "recommended" }, { label: "No I am good" }],
            {
                placeHolder: "Install it now!",
                canPickMany: false,
                title: "You do not have the PROS CLI installed",
            }
        );
        if (labelResponse!.label === "Install it now!") {
            const dirs = await createDirs(context.globalStorageUri.fsPath);
            var response = null;
            if (process.platform === "win32") {
                download(context, "https://github.com/purduesigbots/pros-cli/releases/download/"+version+"/pros_cli-"+version+"-win-64bit.zip", "pros-cli-windows.zip");
                download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-win32.zip", "pros-toolchain-windows.zip");
            } else if (process.platform === "darwin") {
                download(context, "https://github.com/purduesigbots/pros-cli/releases/download/"+version+"/pros_cli-"+version+"-macos-64bit.zip", "pros-cli-macos.zip");
                download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2", "pros-toolchain-macos.tar.bz2", true);
            } else if (process.platform === "linux") {
                download(context, "https://github.com/purduesigbots/pros-cli/releases/download/"+version+"/pros_cli-"+version+"-lin-64bit.zip", "pros-cli-linux.zip");
                download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2", "pros-toolchain-linux.tar.bz2", true);
            }
        } else {
            vscode.window.showInformationMessage("Install it later!");
        }
    } else {
        // User already has the CLI installed
        vscode.window.showInformationMessage("PROS CLI is already Installed!");
    }
    var system = null;

    if (process.platform === "win32") {
        system = "windows";
    } else if (process.platform === "darwin") {
        system = "macos";
    } else if (process.platform === "linux") {
        system = "linux";
    }
    var one_clicked = fs.existsSync(globalPath+"/install/pros-cli-"+system);

    if (!one_clicked) {
        CLI_EXEC_PATH = "pros";
        TOOLCHAIN = "LOCAL"
    } else {
        TOOLCHAIN = globalPath + "/install/pros-toolchain-"+system+"/gcc-arm-none-eabi-10.3-2021.10";
        CLI_EXEC_PATH = globalPath + "/install/pros-cli-"+system+"/pros";        
    }
}

/*

Code Implemented from clangd source code

*/
async function getCliVersion(url : string) {
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

function download(context: vscode.ExtensionContext, downloadURL: string, storagePath: string, bz2: boolean = false) {
    const globalPath = context.globalStorageUri.fsPath;
    window.withProgress({
        location: ProgressLocation.Notification,
        title: "Installing: " + storagePath,
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
        });
        const response = await fetch(downloadURL);
        progress.report({ increment: 0 });
        if (!response.ok) {
            throw new Error(`Failed to download $url`);
        } else if (response.body) {
            const size = Number(response.headers.get('content-length'));
            let read = 0;
            response.body.on('data', (chunk: Buffer) => {
                read += chunk.length;
                progress.report({ increment: read / size });
            });
            const out = fs.createWriteStream(globalPath + '/download/' + storagePath);
            await promisify(stream.pipeline)(response.body, out).catch(e => {
               // Clean up the partial file if the download failed.
               fs.unlink(globalPath + '/download/' + storagePath, (_) => null); // Don't wait, and ignore error.
                throw e;
            });
            if (bz2) {
                vscode.window.showInformationMessage("Extracting bz2: " + storagePath);
                var compressedData = fs.readFileSync(globalPath + '/download/' + storagePath);
                var data = Bunzip.decode(compressedData);
                storagePath = storagePath.replace(".bz2", "");
                fs.writeFileSync(globalPath + '/download/' + storagePath, data);
                // Extract from tar now
                fs.createReadStream(globalPath + '/download/' + storagePath).pipe(tar.extract(globalPath + '/install/'));
                vscode.window.showInformationMessage("Finished extracting bz2: " + storagePath);
            } else {
                vscode.window.showInformationMessage("Extracting: " + storagePath);
                fs.createReadStream(globalPath + '/download/' + storagePath).pipe(unzipper.Extract({path: globalPath + '/install/' + storagePath.replace(".zip","")}));
                vscode.window.showInformationMessage("Finished extracting: " + storagePath);
            }
        }
    });




}