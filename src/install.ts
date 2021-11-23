import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";
import * as stream from 'stream';
//import fetch from 'node-fetch';
//import * as unzipper from 'unzipper';
var fetch = require('node-fetch')
var unzipper = require('unzipper');
import { getVersion } from '@purduesigbots/pros-cli-middleware';
import { window, ProgressLocation } from 'vscode';
var Bunzip = require('seek-bzip');
var tar = require('tar-fs');
export var prosPath: string;


export async function install(context: vscode.ExtensionContext) {

    const globalPath = context.globalStorageUri.fsPath;
    await window.showInformationMessage("Popup to pause install script to fix bug. REMOVE BEFORE RELEASE");
    var cliVersion = null;
    // cliVersion = await getVersion();

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
                download(context, "https://github.com/purduesigbots/pros-cli/releases/download/3.2.3/pros_cli-3.2.3-win-64bit.zip", "pros-cli-windows.zip");
                download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-win32.zip", "pros-toolchain-windows.zip");
                process.env.PROS_TOOLCHAIN = globalPath + "/install/gcc-arm-none-eabi-10.3-2021.10/bin";
                //vscode.window.showInformationMessage(process.env.PROS_TOOLCHAIN);
                prosPath = globalPath + "/install/pros-cli-windows";
            } else if (process.platform === "darwin") {
                download(context, "https://github.com/purduesigbots/pros-cli/releases/download/3.2.3/pros_cli-3.2.3-macos-64bit.zip", "pros-cli-macos.zip");
                download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2", "pros-toolchain-macos.tar.bz2", true);
                process.env.PROS_TOOLCHAIN = globalPath + "/install/gcc-arm-none-eabi-10.3-2021.10/bin";
                vscode.window.showInformationMessage(process.env.PROS_TOOLCHAIN);
                prosPath = globalPath + "/install/pros-cli-3.2.2-macos/pros";
            } else if (process.platform === "linux") {
                download(context, "https://github.com/purduesigbots/pros-cli/releases/download/3.2.3/pros_cli-3.2.3-lin-64bit.zip", "pros-cli-linux.zip");
                download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2", "pros-toolchain-linux.tar.bz2", true);
            }
        } else {
            vscode.window.showInformationMessage("Install it later!");
        }
    } else {
        // User already has the CLI installed
        vscode.window.showInformationMessage("PROS CLI is already Installed!");
    }
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
                fs.createReadStream(globalPath + '/download/' + storagePath).pipe(unzipper.Extract({path: globalPath + '/install/' + storagePath}));
                vscode.window.showInformationMessage("Finished extracting: " + storagePath);
            }
        }
    });




}