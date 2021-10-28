import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";
import * as stream from 'stream';
import fetch from "node-fetch";
import * as unzipper from 'unzipper';
import { getVersion } from '@purduesigbots/pros-cli-middleware';

export async function install(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage("Beginning One-Click Install...");

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
        if (labelResponse.label === "Install it now!") {
            vscode.window.showInformationMessage("Install it now!");
            const dirs = await createDirs(context.globalStorageUri.fsPath);
            var response = null;
            if (process.platform === "win32") {
                // Need some appropriate zip for windows, just installing msi for now
                // await download(context, "https://github.com/purduesigbots/pros-cli/releases/download/3.2.2/pros-windows-msi-3.2.2.0.msi", "pros-cli-windows.zip");
                await download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-win32.zip", "pros-toolchain-windows.zip");
            } else if (process.platform === "darwin") {
                await download(context, "https://github.com/purduesigbots/pros-cli/releases/download/3.2.2/pros_cli-3.2.2-macos.zip", "pros-cli-macos.zip");
                await download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-mac.tar.bz2", "pros-toolchain-macos.tar.bz2", true);

            } else if (process.platform === "linux") {
                await download(context, "https://github.com/purduesigbots/pros-cli/releases/download/3.2.2/pros_cli-3.2.2-lin-64bit.zip", "pros-cli-linux.zip");
                await download(context, "https://developer.arm.com/-/media/Files/downloads/gnu-rm/10.3-2021.10/gcc-arm-none-eabi-10.3-2021.10-x86_64-linux.tar.bz2", "pros-toolchain-linux.tar.bz2", true);
            }

            vscode.window.showInformationMessage("Install Complete");
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
    vscode.window.showInformationMessage(`Folders created`);
    return { install: install, download: download };
}

async function download(context: vscode.ExtensionContext, downloadURL: string, storagePath: string, bz2: boolean = false) {
    const response = await fetch(downloadURL);
    if (!response.ok) {
        throw new Error(`Failed to download $url`);
    } else if (response.body) {
        const size = Number(response.headers.get('content-length'));
        let read = 0;
        response.body.on('data', (chunk: Buffer) => {
            read += chunk.length;
            // progress(read / size);
        });
        const globalPath = context.globalStorageUri.fsPath;
        const out = fs.createWriteStream(globalPath + '/download/' + storagePath);
        await promisify(stream.pipeline)(response.body, out).catch(e => {
            // Clean up the partial file if the download failed.
            fs.unlink(globalPath + '/download/' + storagePath, (_) => null); // Don't wait, and ignore error.
            throw e;
        });
        if (bz2) {
            // First decompress bz2 file then extract tar 
            
        } else {
            const archive = await unzipper.Open.file(globalPath + '/download/' + storagePath);
            await archive.extract({ path: globalPath + '/install/' });
        }

    }
}