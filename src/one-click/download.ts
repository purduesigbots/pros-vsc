import * as vscode from "vscode";
import { window, ProgressLocation } from 'vscode';
var fetch = require('node-fetch');
var unzipper = require('unzipper');
var bunzip = require('seek-bzip');
var tar = require('tar-fs');
import * as fs from 'fs';
import { promisify } from "util";
import * as stream from 'stream';
import * as child_process from "child_process";
import { paths } from './install';
import * as path from 'path';
export function download(context: vscode.ExtensionContext, downloadURL: string, storagePath: string, system: string) {
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
                var data = bunzip.decode(compressedData);
                storagePath = storagePath.replace(".bz2", "");
                fs.writeFileSync(globalPath + '/download/' + storagePath, data);
                // Extract from tar now
                fs.createReadStream(globalPath + '/download/' + storagePath).pipe(tar.extract(globalPath + '/install/'))
                    .on('finish', function () {
                        console.log("Extracted");
                        fs.readdir(globalPath + '/install/', (err, files) => {
                            files.forEach(file => {
                                if (file.includes("pros-cli-linux")) {
                                    //chmod the files that linux needs chmodded
                                    fs.chmodSync(path.join(globalPath,"install",file,"pros"),0o751);
                                    console.log(`Chmod ${path.join(globalPath,"install",file,"pros")}`);
                                    fs.chmodSync(path.join(globalPath,"install",file,"intercept-c++"),0o751);
                                    fs.chmodSync(path.join(globalPath,"install",file,"intercept-cc"),0o751);
                                } else if (file.includes("pros-cli-macos")) {
                                    //chmod the files that mac needs chmodded
                                    fs.readdir(globalPath + '/install/pros-cli-macos/lib/', (err, lib_files) => {
                                        lib_files.forEach(exec => {
                                            if(exec.endsWith(".so")) {
                                                fs.chmodSync(path.join(globalPath,"install","pros-cli-macos","lib"),0o751);
                                            }
                                        });
                                    });

                                    fs.chmodSync(path.join(globalPath,"install",file,"pros"),0o751);
                                    fs.chmodSync(path.join(globalPath,"install",file,"intercept-c++"),0o751);
                                    fs.chmodSync(path.join(globalPath,"install",file,"intercept-cc"),0o751);
                                } else if (!file.includes("pros-cli-")) {
                                    storagePath = storagePath.replace(".tar", "");
                                    fs.renameSync(globalPath + '/install/' + file, globalPath + '/install/' + storagePath);
                                }
                            });
                        });
                    });
                //vscode.window.showInformationMessage("Finished extracting bz2: " + storagePath);
            } else {
                vscode.window.showInformationMessage("Extracting: " + storagePath);
                fs.createReadStream(globalPath + '/download/' + storagePath).pipe(unzipper.Extract({ path: globalPath + '/install/' + storagePath.replace(".zip", "") }))
                    .on('finish', function() {
                        if(storagePath.includes('pros-toolchain-windows')) {
                            // create tmp folder
                            console.log("Creating tmp folder on windows");
                            fs.mkdirSync(path.join(globalPath,"install","pros-toolchain-windows","tmp"));
                            console.log("Extracting GCC ARM contents to main folder");
                            // extract contents of gcc-arm-none-eabi-version folder
                            fs.readdir(path.join(globalPath,"install","pros-toolchain-windows","usr"), (err, files) => {
                                files.forEach(dir => {
                                    if(dir.includes("gcc-arm-none")) {
                                        // iterate through each folder in gcc-arm-none-eabi-version
                                        fs.readdir(path.join(globalPath,"install","pros-toolchain-windows","usr",dir), (error, folders) => {
                                            folders.forEach(folder => {
                                                if(!folder.includes("arm-none")) {
                                                    fs.readdir(path.join(globalPath,"install","pros-toolchain-windows","usr",dir,folder), (errorsub, subfiles) => {
                                                        console.log(`Copying ${folder} folder`);
                                                        // extract each file in subfolder
                                                        subfiles.forEach(subfile => {
                                                            var original_path = path.join(globalPath, "install","pros-toolchain-windows","usr",dir,folder,subfile);
                                                            var new_path = path.join(globalPath, "install","pros-toolchain-windows","usr",folder,subfile);
                                                            fs.renameSync(original_path, new_path);
                                                        });
                                                        if(errorsub) throw errorsub;
                                                    });
                                                } else {
                                                    console.log("Copying arm-none-eabi folder");
                                                    var original_path = path.join(globalPath, "install","pros-toolchain-windows","usr",dir,folder);
                                                    var new_path = path.join(globalPath, "install","pros-toolchain-windows","usr",folder);
                                                    fs.renameSync(original_path, new_path);
                                                }
                                            });
                                        if (error) throw error;
                                        });
                                        fs.rmdirSync(dir, {recursive:true});
                                    }
                                });
                                if(err) throw err;
                            });
                        }
                    });
                //vscode.window.showInformationMessage("Finished extracting: " + storagePath);
            }
        }

        // try {
        //     var command = `chmod -R +x "${path.join(globalPath, "install", storagePath)}"`;
        //     console.log(command);
        //     const { stdout, stderr } = await promisify(child_process.exec)(
        //         command, { timeout: 60000 }
        //     );
        //     console.log(stdout);
        // } catch (error) {
        //     console.log(error.stdout);
        // }
        vscode.window.showInformationMessage("Finished extracting: " + storagePath);
        paths(globalPath, system);
    });
    paths(globalPath, system);
}