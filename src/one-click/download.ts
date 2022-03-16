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

//const delay = ms => new Promise(res => setTimeout(res, ms));

async function download(
  globalPath: string,
  downloadURL: string,
  storagePath: string,
  system: string
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
      } else if (response.body) {
        const size = Number(response.headers.get("content-length"));
        let read = 0;
        response.body.on("data", (chunk: Buffer) => {
          read += chunk.length;
          progress.report({ increment: read / size });
        });
        // Write file contents to "sigbots.pros/download/filename.tar.bz2"
        out = fs.createWriteStream(
          path.join(globalPath, "download", storagePath)
        );
        await promisify(stream.pipeline)(response.body, out).catch((e) => {
          // Clean up the partial file if the download failed.
          fs.unlink(
            path.join(globalPath, "download", storagePath),
            (_) => null
          ); // Don't wait, and ignore error.
          throw e;
        });
      }
    }
  );
  return bz2;
}

export async function extract(
  globalPath: string,
  downloadURL: string,
  storagePath: string,
  system: string,
  bz2: boolean
) {
  // Issues with extracter and 2 empty folders, so we are gonna make the empty folders ourselves
  if (system === "windows" && storagePath.includes("toolchain")) {
    try {
      await fs.promises.mkdir(
        path.join(
          globalPath,
          "install",
          storagePath,
          "usr",
          "gcc-arm-none-eabi-10.3-2021.10",
          "arm-none-eabi",
          "include",
          "bits"
        )
      );
      await fs.promises.mkdir(
        path.join(
          globalPath,
          "install",
          storagePath,
          "usr",
          "gcc-arm-none-eabi-10.3-2021.10",
          "arm-none-eabi",
          "include",
          "rpc"
        )
      );
      await fs.promises.mkdir(
        path.join(globalPath, "install", storagePath, "tmp")
      );
    } catch (e) {
      console.log(e);
    }
  }

  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title:
        "Installing: " +
        (storagePath.includes("cli") ? "PROS CLI" : "PROS Toolchain"),
      cancellable: true,
    },
    async (progress, token) => {
      //progress.report({ increment: 0 });
      var read: fs.ReadStream;
      var extract: fs.WriteStream;
      token.onCancellationRequested((token) => {
        console.log("User canceled the long running operation");
        read!.destroy();
        extract!.destroy();
      });

      if (bz2) {
        // Read the contents of the bz2 file
        var compressedData = await fs.promises.readFile(
          path.join(globalPath, "download", storagePath)
        );
        // Decrypt the bz2 file contents.
        var data = await bunzip.decode(compressedData);
        storagePath = storagePath.replace(".bz2", "");
        await fs.promises.writeFile(
          path.join(globalPath, "download", storagePath),
          data
        );
        // Write contents of the decrypted bz2 into "sigbots.pros/download/filename.tar"
        read = fs.createReadStream(
          path.join(globalPath, "download", storagePath)
        );
        storagePath = storagePath.replace(".tar","");
        extract = tar.extract(path.join(globalPath, "install", storagePath));
        
        await promisify(stream.pipeline)(read, extract).catch((e) => {
          console.log("Error occured on extraction");
          console.log(e);
          fs.unlink(path.join(globalPath, "install", storagePath), (_) => null); // Don't wait, and ignore error.
          throw e;
        });
        
        const files = await fs.promises.readdir(
          path.join(globalPath, "install")
        );

        for (const file of files) {
          console.log(file);
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
        //vscode.window.showInformationMessage("Finished extracting bz2: " + storagePath);
      } else {
        //await fs.createReadStream(globalPath + '/download/' + storagePath).pipe(unzipper.Extract({ path: globalPath + '/install/' + storagePath.replace(".zip", "") }));

        // Create read stream of the zipped file
        const read = fs.createReadStream(
          path.join(globalPath, "download", storagePath)
        );
        read.on("entry", (entry) => {
          console.log(entry);
        });
        storagePath = storagePath.replace(".zip", "");
        // await a promise of extracting the zip file
        await promisify(stream.pipeline)(
          read,
          unzipper.Extract({
            path: path.join(globalPath, "install", storagePath),
          })
        ).catch((e) => {
          console.log("Error occured on extraction");
          console.log(e);
          fs.unlink(path.join(globalPath, "install", storagePath), (_) => null); // Don't wait, and ignore error.
          throw e;
        });
        console.log("Start file moving");
        if (storagePath.includes("pros-toolchain-windows")) {
          // create tmp folder
          // extract contents of gcc-arm-none-eabi-version folder
          const files = await fs.promises.readdir(
            path.join(globalPath, "install", "pros-toolchain-windows", "usr")
          );
          for (const dir of files) {
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
              for (const folder of folders) {
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
                  for (const subfile of subfiles) {
                    var originalPath = path.join(
                      globalPath,
                      "install",
                      "pros-toolchain-windows",
                      "usr",
                      dir,
                      folder,
                      subfile
                    );
                    var newPath = path.join(
                      globalPath,
                      "install",
                      "pros-toolchain-windows",
                      "usr",
                      folder,
                      subfile
                    );
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
                }
              }
              await fs.promises.rmdir(dir, { recursive: true });
            }
          }

          await fs.promises.mkdir(
            path.join(globalPath, "install", "pros-toolchain-windows", "tmp")
          );
        }
      }
    }
  );
  console.log("finished extraction");
  return true;
}

export async function downloadextract(
  context: vscode.ExtensionContext,
  downloadURL: string,
  storagePath: string,
  system: string
) {
  const globalPath = context.globalStorageUri.fsPath;
  const bz2 = await download(globalPath, downloadURL, storagePath, system);
  await extract(globalPath, downloadURL, storagePath, system, bz2);
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
  if (system === "macos") {
    chmodList.push(
      fs.promises.chmod(
        path.join(globalPath, "install", "pros-cli-macos", "lib", "*.so"),
        0o751
      )
    );
  }
  await Promise.all(chmodList);
}
