import * as vscode from "vscode";
import { window, ProgressLocation } from 'vscode';
var fetch = require('node-fetch');
var unzipper = require('unzipper');
var bunzip = require('seek-bzip');
var tar = require('tar-fs');
import * as fs from 'fs';
import { promisify } from "util";
import * as stream from 'stream';
import { paths } from './install';
import * as path from 'path';
export async function download(context: vscode.ExtensionContext, downloadURL: string, storagePath: string, system: string) {
    const globalPath = context.globalStorageUri.fsPath;
    // Check if file type is .tar.bz or .zip
    const bz2 = downloadURL.includes(".bz2");
    await window.withProgress({
        location: ProgressLocation.Notification,
        title: "Downloading: " + storagePath,
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
        });
        // Fetch the file to download
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
            // Write file contents to "sigbots.pros/download/filename.tar.bz2"
            const out = fs.createWriteStream(path.join(globalPath, 'download', storagePath));
            await promisify(stream.pipeline)(response.body, out).catch(e => {
                // Clean up the partial file if the download failed.
                fs.unlink(path.join(globalPath, 'download', storagePath), (_) => null); // Don't wait, and ignore error.
                throw e;
            });
        }
    }).then(() => {
            window.withProgress({
                location: ProgressLocation.Notification,
                title: "Installing: " + storagePath,
                cancellable: true
            }, async (progress, token) => {
                
                token.onCancellationRequested(() => {
                    console.log("User canceled the long running operation");
                });
                
               await new Promise((resolve) => {
                    if (bz2) {
                        // Read the contents of the bz2 file
                        var compressedData = fs.readFileSync(path.join(globalPath, 'download', storagePath));
                        // Decrypt the bz2 file contents.
                        var data = bunzip.decode(compressedData);
                        storagePath = storagePath.replace(".bz2", "");
                        fs.writeFileSync(path.join(globalPath, 'download', storagePath), data);
                        // Write contents of the decrypted bz2 into "sigbots.pros/download/filename.tar"
                        fs.createReadStream(path.join(globalPath, 'download', storagePath)).pipe(tar.extract(path.join(globalPath, 'install')))
                        .on('finish', function () {
                            fs.readdir(path.join(globalPath, 'install'), (err, files) => {
                                files.forEach(file => {
                                    if(!file.includes('pros-')) { 
                                        storagePath = storagePath.replace(".tar", "");
                                        fs.renameSync(path.join(globalPath, 'download', file), path.join(globalPath, 'install', storagePath));
                                    }
                                });
                            });
                        });
                    //vscode.window.showInformationMessage("Finished extracting bz2: " + storagePath);
                    } else {
                        fs.createReadStream(globalPath + '/download/' + storagePath).pipe(unzipper.Extract({ path: globalPath + '/install/' + storagePath.replace(".zip", "") }))
                        .on('finish', function () {

                            if (storagePath.includes('pros-toolchain-windows')) {
                                // create tmp folder
                                console.log("Creating tmp folder on windows");
                                fs.mkdirSync(path.join(globalPath, "install", "pros-toolchain-windows", "tmp"));
                                console.log("Extracting GCC ARM contents to main folder");
                                // extract contents of gcc-arm-none-eabi-version folder
                                fs.readdir(path.join(globalPath, "install", "pros-toolchain-windows", "usr"), (err, files) => {
                                    for(const dir in files) {
                                        if (dir.includes("gcc-arm-none")) {
                                            // iterate through each folder in gcc-arm-none-eabi-version
                                            fs.readdir(path.join(globalPath, "install", "pros-toolchain-windows", "usr", dir), (error, folders) => {
                                                for(const folder in folders) {
                                                    if (!folder.includes("arm-none")) {
                                                        fs.readdir(path.join(globalPath, "install", "pros-toolchain-windows", "usr", dir, folder), (errorsub, subfiles) => {
                                                            // console.log(`Copying ${folder} folder`);
                                                            // extract each file in subfolder
                                                            for(const subfile in subfiles) {
                                                                var originalPath = path.join(globalPath, "install", "pros-toolchain-windows", "usr", dir, folder, subfile);
                                                                var newPath = path.join(globalPath, "install", "pros-toolchain-windows", "usr", folder, subfile);
                                                                fs.renameSync(originalPath, newPath);
                                                            }
                                                            if (errorsub) {
                                                                throw new Error("error");
                                                            }
                                                        });
                                                    } else {
                                                        console.log("Copying arm-none-eabi folder");
                                                        var originalPath = path.join(globalPath, "install", "pros-toolchain-windows", "usr", dir, folder);
                                                        var newPath = path.join(globalPath, "install", "pros-toolchain-windows", "usr", folder);
                                                        fs.renameSync(originalPath, newPath);
                                                    }
                                                }
                                                if (error) {
                                                    throw new Error("error");
                                                }
                                            });
                                            fs.rmdirSync(dir, { recursive: true });
                                        }
                                    }
                                    if (err) {
                                        throw new Error("error");
                                    }
                                });
                            }
                        });
                    }
                resolve("hahahah");
               });
                //stuff().then((v) => resolve(v));/*.finally(() => window.showInformationMessage(`Finished installing PROS ${storagePath.includes("cli") ? "CLI" : "Toolchain"}.`))
                //.catch(err => console.log(err));
                //window.showInformationMessage(`Finished installing PROS ${storagePath.includes("cli") ? "CLI" : "Toolchain"}.`);
                //*/
                });
            
        }).then(() => window.showInformationMessage(`Finished installing PROS ${storagePath.includes("cli") ? "CLI" : "Toolchain"}.`));
        console.log("chmodding");
        chmod(globalPath, system);
        paths(globalPath, system, context);
    //window.showInformationMessage(`Finished installing PROS ${storagePath.includes("cli") ? "CLI" : "Toolchain"}.`);
    return true;
}

export function chmod(globalPath : string, system : string) {
    if (system === "windows") {
        return
    }
    
    fs.readdir(path.join(globalPath,'install'), (err, files) => {
        files.forEach(file => {
            if (file.includes("pros-cli-macos")) {
                //chmod the files the so files on mac
                fs.chmodSync(path.join(globalPath,'install','pros-cli-macos','lib','*.so'), 0o751);
                /*
                fs.readdir(globalPath + '/install/pros-cli-macos/lib/', (err, libFiles) => {
                    libFiles.forEach(exec => {
                        if (exec.endsWith(".so")) {
                            fs.chmodSync(path.join(globalPath, "install", "pros-cli-macos", "lib"), 0o751);
                        }
                    });
                });
                */
            }

            // Chmod the executables (pros and intercepts)
            fs.chmodSync(path.join(globalPath, "install", file, "pros"), 0o751);
            fs.chmodSync(path.join(globalPath, "install", file, "intercept-c++"), 0o751);
            fs.chmodSync(path.join(globalPath, "install", file, "intercept-cc"), 0o751);
        });
    });
}