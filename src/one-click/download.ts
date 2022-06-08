import * as vscode from "vscode";
import { window, ProgressLocation } from "vscode";
var fetch = require("node-fetch");
var unzipper = require("unzipper");
var bunzip = require("seek-bzip");
var tar = require("tar-fs");
import * as fs from "fs";
import * as stream from "stream";
import * as path from "path";
import { promisify } from "util";


async function download(
  globalPath: string,
  downloadURL: string,
  storagePath: string
) {
  // Check if file type is .tar.bz or .zip
  const bz2 = downloadURL.includes(".bz2");
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title:
        "Downloading: " +
        (storagePath.includes("cli") ? "PROS CLI" : "PROS Toolchain"),
      cancellable: true,
    },
    async (progress, token) => {
      var out: fs.WriteStream;
      token.onCancellationRequested(() => {
        console.log("User canceled the long running operation");
        out!.destroy();
      });
      // Fetch the file to download
      const response = await fetch(downloadURL);
      progress.report({ increment: 0 });

      if (!response.ok) {
        throw new Error(`Failed to download $url`);
      } 
      const total_size = Number(response.headers.get("content-length"));

      response.body.on("data", (chunk: Buffer) => {
        progress.report({ increment: chunk.length * 100 / total_size });
      });
      console.log("Write stream created")
      // Write file contents to "sigbots.pros/download/filename.tar.bz2"
      out = fs.createWriteStream(
        path.join(globalPath, "download", storagePath)
      );
      console.log("Start stream pipeline");
      await promisify(stream.pipeline)(response.body, out).catch((e) => {
        // Clean up the partial file if the download failed.
        fs.unlink(
          path.join(globalPath, "download", storagePath),
          (_) => null
        ); // Don't wait, and ignore error.
        console.log(e);
        throw e;
      });
      console.log("Finished downloading")
    }
  );
  console.log("returning bz2 status");
  return bz2;
}

export async function extract(
  globalPath: string,
  storagePath: string,
  bz2: boolean
) {
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title:
        "Installing: " +
        (storagePath.includes("cli") ? "PROS CLI" : "PROS Toolchain"),
      cancellable: true,
    },
    async (progress, token) => {
      var read: fs.ReadStream;
      var extract: fs.WriteStream;
      token.onCancellationRequested((token) => {
        console.log("User canceled the long running operation");
        read!.destroy();
        extract!.destroy();
      });

      if (bz2) {
        // Read the contents of the bz2 file
        console.log("Extracting bz2 file");
        var compressedData = await fs.promises.readFile(
          path.join(globalPath, "download", storagePath)
        );

        console.log("Decoding bz2");
        // Decrypt the bz2 file contents.
        let decompressedData;
        try {
          decompressedData = bunzip.decode(compressedData);
        } catch(e: any) {
          console.log(e);
          vscode.window.showErrorMessage("An error occured while decoding the toolchain");
          console.log("Decoding failed");
        }

        console.log("Bz2 decoded");
        storagePath = storagePath.replace(".bz2", "");
        await fs.promises.writeFile(
          path.join(globalPath, "download", storagePath),
          decompressedData
        );
        console.log("Completed extraction of bz2 file");
        // Write contents of the decrypted bz2 into "sigbots.pros/download/filename.tar"
        console.log("Extracting tar file");

        await new Promise(function(resolve, reject) {
          // Create our read stream
          read = fs.createReadStream(
            path.join(globalPath, "download", storagePath)
          );
          // Remove tar from the filename
          storagePath = storagePath.replace(".tar","");
          // create our write stream
          extract = tar.extract(path.join(globalPath, "install", storagePath));
          // Pipe the read stream into the write stream
          read.pipe(extract);
          // When the write stream ends, resolve the promise
          extract.on("finish", resolve);
          // If there's an error, reject the promise and clean up
          read.on("error", () => {
            fs.unlink(path.join(globalPath, "install", storagePath), (_) => null);
            reject();
          });
        });
        

        const files = await fs.promises.readdir(
          path.join(globalPath, "install")
        );

        for (const file of files) {
          if (file.includes("toolchain")) {
            const interfiles = await fs.promises.readdir(
              path.join(globalPath, "install", file)
            );
            for (const intfile of interfiles) {
              if (intfile.includes("gcc-arm-none-eabi")) {
                const to_bring_out = await fs.promises.readdir(
                  path.join(globalPath, "install", file, intfile)
                );
                for(const f of to_bring_out) {
                  await fs.promises.rename(
                    path.join(globalPath, "install", file, intfile, f),
                    path.join(globalPath, "install", file, f)
                  )
                }
              }
            }
            console.log(path.join(globalPath, "install", storagePath));
          }
        }
        
      } // if bz2
      else {
        console.log("start extraction");
        let readPath = path.join(globalPath, "download", storagePath);
        storagePath = storagePath.replace(".zip","");
        let writePath = path.join(globalPath, "install", storagePath);

        // Extract the contents of the zip file
        await fs.createReadStream(readPath).pipe(unzipper.Extract({ path: writePath})).promise();
        console.log("Start file moving");
        if (storagePath.includes("pros-toolchain-windows")) {
          
          // create tmp folder
          console.log("Create tmp folder");
          await fs.promises.mkdir(
            path.join(globalPath, "install", "pros-toolchain-windows", "tmp")
            );
          
          // extract contents of gcc-arm-none-eabi-version folder
          console.log("began reading usr");
          const files = await fs.promises.readdir(
            path.join(globalPath, "install", "pros-toolchain-windows", "usr")
          );
          for await (const dir of files) {
            if (dir.includes("gcc-arm-none")) {
              // iterate through each folder in gcc-arm-none-eabi-version
              const folders = await fs.promises.readdir(
                path.join(
                  globalPath,
                  "install",
                  "pros-toolchain-windows",
                  "usr",
                  dir
                )
              );
              for await (const folder of folders) {
                if (!folder.includes("arm-none")) {
                  const subfiles = await fs.promises.readdir(
                    path.join(
                      globalPath,
                      "install",
                      "pros-toolchain-windows",
                      "usr",
                      dir,
                      folder
                    )
                  );

                  // extract everything back 1 level into their respective folder
                  for await (const subfile of subfiles) {
                    // The original file path
                    var originalPath = path.join(
                      globalPath,
                      "install",
                      "pros-toolchain-windows",
                      "usr",
                      dir,
                      folder,
                      subfile
                    );
                    // Path to move the file to
                    var newPath = path.join(
                      globalPath,
                      "install",
                      "pros-toolchain-windows",
                      "usr",
                      folder,
                      subfile
                    );
                    // Move the file
                    await fs.promises.rename(originalPath, newPath);
                  }
                } else {
                  // move arm-none folder contents into a new directory under usr
                  var originalPath = path.join(
                    globalPath,
                    "install",
                    "pros-toolchain-windows",
                    "usr",
                    dir,
                    folder
                  );

                  var newPath = path.join(
                    globalPath,
                    "install",
                    "pros-toolchain-windows",
                    "usr",
                    folder
                  );
                  await fs.promises.rename(originalPath, newPath);
                } // file in subfolder
              } // folder in gcc-arm-none-eabiversion

            } // if subfolder is gcc-arm-none-eabiversion


          } // for usr folder's subdirectories
        } // windows toolchain

      } // not bz2
    }
  );
  console.log("finished extraction for " + storagePath);
  return true;
}

export async function downloadextract(
  context: vscode.ExtensionContext,
  downloadURL: string,
  storagePath: string
) {
  const globalPath = context.globalStorageUri.fsPath;
  const bz2 = await download(globalPath, downloadURL, storagePath);
  await extract(globalPath, storagePath,  bz2);
  console.log(`Finished Installing ${storagePath}`);
  window.showInformationMessage(`Finished Installing ${storagePath}`);
  return true;
}

export async function chmod(globalPath: string, system: string) {
  if (system === "windows") {
    return;
  }

  const chmodList = [
    fs.promises.chmod(
      path.join(globalPath, "install", `pros-cli-${system}`, "pros"),
      0o751
    ),
    fs.promises.chmod(
      path.join(globalPath, "install", `pros-cli-${system}`, "intercept-c++"),
      0o751
    ),
    fs.promises.chmod(
      path.join(globalPath, "install", `pros-cli-${system}`, "intercept-cc"),
      0o751
    ),
  ];

  /*
  if (system === "macos") {
    chmodList.push(
      fs.promises.chmod(
        path.join(globalPath, "install", "pros-cli-macos", "lib", "*.so"),
        0o751
      )
    );
  }
  */
  await Promise.all(chmodList);
}
