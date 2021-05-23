import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { PREFIX } from "./cli-parsing";

const getUploadSlot = async () => {
  let slots = [];
  for (let i = 1; i < 9; i++) {
    slots.push({ label: `${i}` });
  }
  const slot = await vscode.window.showQuickPick(slots, {
    canPickMany: false,
    title: "Choose the slot to upload to",
    placeHolder: "1",
  });
  return slot?.label ?? "1";
};

const runUpload = async (slot: string) => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading libraries",
      cancellable: false,
    },
    async (progress, token) => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          const { stdout, stderr } = await promisify(child_process.exec)(
            `pros u --slot ${slot} --project ${vscode.workspace.workspaceFolders?.[0].uri.path} --machine-output`
          );

          await vscode.window.showInformationMessage("Project Uploaded!");
          resolve();
        } catch (err) {
          for (let e of err.stdout.split(/\r?\n/)) {
            if (e.startsWith(PREFIX)) {
              let jdata = JSON.parse(e.substr(PREFIX.length));
              if (jdata.type.startsWith("log") && jdata.level === "ERROR") {
                reject(new Error(jdata.simpleMessage));
              }
            }
          }
        }
      });
    }
  );
};

export const upload = async () => {
  const slot = await getUploadSlot();

  try {
    await runUpload(slot);
  } catch (err) {
    await vscode.window.showErrorMessage(err.message);
  }
};
