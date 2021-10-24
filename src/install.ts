import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";
import * as stream from 'stream';
import fetch from "node-fetch";
import * as unzipper from 'unzipper';
import * as child_process from "child_process";

export async function install(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage("Beginning Install...");
    const storagePath = context.globalStorageUri.fsPath;
    const dirs = await createDirs(storagePath);


    const response = await fetch("https://github.com/purduesigbots/pros-cli/releases/download/3.2.2/pros_cli-3.2.2-macos.zip");
    if (!response.ok) {
        throw new Error(`Failed to download $url`);
    } else if (response.body) {
        const size = Number(response.headers.get('content-length'));
        let read = 0;
        response.body.on('data', (chunk: Buffer) => {
            read += chunk.length;
            // progress(read / size);
        });
        const out = fs.createWriteStream(storagePath + '/download/pros_cli-3.2.2-macos.zip');
        await promisify(stream.pipeline)(response.body, out).catch(e => {
            // Clean up the partial file if the download failed.
            fs.unlink(storagePath + '/download/pros_cli-3.2.2-macos.zip', (_) => null); // Don't wait, and ignore error.
            throw e;
        });
    }

    const archive = await unzipper.Open.file(storagePath + '/download/pros_cli-3.2.2-macos.zip');
    await archive.extract({ path: storagePath + '/install/pros_cli-3.2.2-macos.zip' });
    vscode.window.showInformationMessage("Install Complete");
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