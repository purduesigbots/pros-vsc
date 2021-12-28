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
import { resolveCliPathFromVSCodeExecutablePath } from "vscode-test";
//import { glob } from "glob";
//import { version } from "process";
var Bunzip = require('seek-bzip');
var tar = require('tar-fs');

//TOOLCHAIN and CLI_EXEC_PATH are exported and used for running commands.
export var TOOLCHAIN: string;
export var CLI_EXEC_PATH: string;
export var PATH_SEP: string;
export async function install(context: vscode.ExtensionContext) {
    const globalPath = context.globalStorageUri.fsPath;
    var cliVersion = null;
    //cliVersion = await getVersion();
    var version = await getCliVersion('https://api.github.com/repos/purduesigbots/pros-cli/releases/latest');
    console.log("Current CLI Version: " + version);

    var download_cli = "N";
    var cli_name = "N";
    var download_toolchain = "N";
    var toolchain_name = "N";
    var system = "windows";
    if (process.platform === "win32") {
        system = "windows";
        PATH_SEP = ";";
        download_cli = "https://github.com/purduesigbots/pros-cli/releases/download/"+version+"/pros_cli-"+version+"-win-64bit.zip";
        download_toolchain = "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-win32.zip";
    } else if (process.platform === "darwin") {
        system = "macos";
        PATH_SEP = ":";
        download_cli = "https://github.com/purduesigbots/pros-cli/releases/download/"+version+"/pros_cli-"+version+"-macos-64bit.zip";
        download_toolchain = "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2";
    } else if (process.platform === "linux") {
        system = "linux";
        PATH_SEP = ":";
        download_cli = "https://github.com/purduesigbots/pros-cli/releases/download/"+version+"/pros_cli-"+version+"-lin-64bit.zip";
        download_toolchain = "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2";
    }
    cli_name = "pros-cli-"+system+".zip";
    toolchain_name = "pros-toolchain-"+system+(system ==="windows" ? ".zip" : ".tar.bz2");
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
            download(context, download_cli, cli_name, system);
            download(context, download_toolchain, toolchain_name, system);
        } else {
            vscode.window.showInformationMessage("Install it later!");
        }
    } else {
        // User already has the CLI installed
        vscode.window.showInformationMessage("PROS CLI is already Installed!");
    }
    paths(globalPath, system);
}

async function paths(globalPath : string, system : string) {
    var one_clicked = fs.existsSync(path.join(globalPath,"install","pros-cli-"+system));

    if (!one_clicked) {
        CLI_EXEC_PATH = "pros";
        TOOLCHAIN = "LOCAL"
    } else {

        //CLI_EXEC_PATH gets quotes but TOOLCHAIN doesn't because reasons.....
        TOOLCHAIN = path.join(globalPath, "install","pros-toolchain-"+system,"usr");
        //Do we put a .exe extension onto the exec path if the user is on windows? right now no.
        CLI_EXEC_PATH = "\""+path.join(globalPath, "install","pros-cli-"+system)+"\""; 
        //console.log(TOOLCHAIN);
        //console.log(CLI_EXEC_PATH);
    }

    //SHELL = (system=="windows" ? path.join(TOOLCHAIN,"bin","sh.exe") : "None");
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

function download(context: vscode.ExtensionContext, downloadURL: string, storagePath: string, system : string) {
    const globalPath = context.globalStorageUri.fsPath;
    var bz2 = false;
    if (downloadURL.includes(".bz2")) {
        bz2 = true;
    }
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
    paths(globalPath, system);
}