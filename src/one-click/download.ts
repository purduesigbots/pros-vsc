import * as vscode from "vscode";
import { window, ProgressLocation } from "vscode";
var fetch = require("node-fetch");
var admzip = require("adm-zip");
var tar = require("tar-fs");
try {
  var lzma = require("lzma-native");
} catch (err) {
  lzma = null;
}
import * as fs from "fs";
import * as stream from "stream";
import * as path from "path";
import { promisify } from "util";

import { prosLogger } from "../extension";
import { execSync } from "child_process";

async function download(
  globalPath: string,
  downloadURL: string,
  storagePath: string,
  downloadName?: string
) {
  // Check if file type is .tar.bz or .zip

  const xz = downloadURL.includes(".xz");
  await prosLogger.log("OneClick", `Downloading ${downloadURL}`);
  await prosLogger.log("OneClick", `Storage Path: ${storagePath}`);

  downloadName =
    "Downloading: " +
    (downloadName ??
      (storagePath.includes("cli")
        ? "PROS CLI"
        : storagePath.includes("toolchain")
        ? "PROS Toolchain"
        : "VEX Vexcom"));

  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: downloadName,
      cancellable: true,
    },
    async (progress, token) => {
      var out: fs.WriteStream;
      token.onCancellationRequested(() => {
        out!.destroy();
      });
      // Fetch the file to download
      console.log("fetching");
      const response = await fetch(downloadURL);
      console.log("incrementing");
      progress.report({ increment: 0 });

      if (!response.ok) {
        throw new Error(`Failed to download $url`);
      }
      console.log("downloading url OK");
      const totalSize = Number(response.headers.get("content-length"));

      response.body.on("data", (chunk: Buffer) => {
        console.log("chunk");
        progress.report({ increment: (chunk.length * 100) / totalSize });
      });
      // Write file contents to "sigbots.pros/download/filename.tar.bz2"
      console.log("creating write stream");
      out = fs.createWriteStream(
        path.join(globalPath, "download", storagePath)
      );
      console.log("writing to file");
      await promisify(stream.pipeline)(response.body, out).catch((e) => {
        // Clean up the partial file if the download failed.
        fs.unlink(path.join(globalPath, "download", storagePath), (_) => null); // Don't wait, and ignore error.
        console.log(e);
        throw e;
      });
      out.close();
    }
  );
  return xz;
}

export async function extract(
  globalPath: string,
  storagePath: string,
  xzFile: boolean,
  extractName?: string
) {
  await prosLogger.log("OneClick", `Extracting ${storagePath}`);
  extractName =
    "Installing: " +
    (extractName ??
      (storagePath.includes("cli")
        ? "PROS CLI"
        : storagePath.includes("toolchain")
        ? "PROS Toolchain"
        : "VEX Vexcom"));
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: extractName,
      cancellable: true,
    },
    async (_progress, token) => {
      var read: fs.ReadStream;
      var extract: fs.WriteStream;
      token.onCancellationRequested((token) => {
        prosLogger.log("OneClick", `Cancelled extraction of ${storagePath}`);
        console.log("User canceled the long running operation");
        read.close();
        extract.close();
      });

      if (xzFile) {
        let readPath = path.join(globalPath, "download", storagePath);

        if (readPath.includes("macos")) {
          fs.mkdirSync(readPath.replace(".tar.xz", ""));
          execSync(`tar -xf "${readPath}" -C "${readPath.replace(".tar.xz", "")}"`);
        } else {
          await new Promise(function (resolve, reject) {
            // Create our read stream
            prosLogger.log("OneClick", `Creating read stream for ${storagePath}`);
            const stats = fs.statSync(
              path.join(globalPath, "download", storagePath)
            );
            const totalSize = stats.size;
            read = fs.createReadStream(
              path.join(globalPath, "download", storagePath)
            );
            var decompress = new lzma.createDecompressor();
            decompress.on("data", (chunk: Buffer | string | any) => {
              _progress.report({ increment: (chunk.length * 100) / totalSize });
            });
            // Remove tar from the filename
            storagePath = storagePath.replace(".tar.xz", "");
            // create our write stream
            prosLogger.log(
              "OneClick",
              `Extracting ${storagePath} to install folder`
            );
            extract = tar.extract(path.join(globalPath, "download", storagePath));
            // Pipe the read stream into the write stream
            read.pipe(decompress).pipe(extract);
            // When the write stream ends, resolve the promise
            extract.on("finish", resolve);
            // If there's an error, reject the promise and clean up
            read.on("error", () => {
              prosLogger.log("OneClick", `Error occured for ${storagePath}`);
              fs.unlink(
                path.join(globalPath, "download", storagePath),
                (_) => null
              );
              reject();
            });
          });
        }

        storagePath = storagePath.replace(".tar.xz", "");

        const files = await fs.promises.readdir(
          path.join(globalPath, "download", storagePath)
        );

        for (const file of files) {
          if (file.includes("arm-none-eabi")) {
            await fs.promises.rename(
              path.join(globalPath, "download", storagePath, file),
              path.join(globalPath, "install", storagePath)
            );
          }
        }
      } // if bz2
      else {
        let readPath = path.join(globalPath, "download", storagePath);
        storagePath = storagePath.replace(".zip", "");
        let writePath = path.join(globalPath, "install", storagePath);

        // Extract the contents of  the zip file
        if (readPath.includes("pros-vision-macos")) {
          execSync(
            `unzip ${readPath.replace(" ", "\\ ")} -d ${writePath.replace(
              " ",
              "\\ "
            )}`
          );
        } else {
          var zip = new admzip(readPath);
          zip.extractAllTo(writePath, true);
        }
        await prosLogger.log(
          "OneClick",
          `Extracting ${readPath} to ${writePath}`
        );
        if (storagePath.includes("pros-toolchain-windows")) {
          await fs.promises.mkdir(
            path.join(globalPath, "install", "pros-toolchain-windows", "tmp")
          );
        }
      } // not bz2
    }
  );
  console.log("finished extraction for " + storagePath);
  return true;
}

export async function downloadextract(
  context: vscode.ExtensionContext,
  downloadURL: string,
  storagePath: string,
  name?: string
) {
  const globalPath = context.globalStorageUri.fsPath;
  const xz = await download(
    globalPath,
    downloadURL,
    storagePath,
    name ?? undefined
  );
  console.log("download done");
  await extract(globalPath, storagePath, xz, name ?? undefined);
  console.log(`Finished Installing ${storagePath}`);
  window.showInformationMessage(`Finished Installing ${name ?? ""}`);
  return true;
}

export async function chmod(globalPath: string, system: string) {
  if (system === "windows") {
    await prosLogger.log("OneClick", "No chmod needed on windows");
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
    fs.promises.chmod(
      path.join(globalPath, "install", `vex-vexcom-${system}`, "vexcom"),
      0o751
    ),
  ];
  await prosLogger.log(
    "OneClick",
    "Changing permissions on pros, intercept-c++, and intercept-cc executables"
  );
  await Promise.all(chmodList);
}
