import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";

import { parseErrorMessage } from "./cli-parsing";

/**
 * Query the user for the slot on the v5 to upload the project to
 *
 * @returns A slot number (as a string)
 */
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

/**
 * Call the PROS upload CLI command.
 *
 * @param slot The slot number to place the executable in
 */
const runUpload = async (slot: string) => {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading libraries",
      cancellable: false,
    },
    async (progress, token) => {
      try {
        const { stdout, stderr } = await promisify(child_process.exec)(
          `pros u --slot ${slot} --project ${vscode.workspace.workspaceFolders?.[0].uri.path} --machine-output`
        );

        await vscode.window.showInformationMessage("Project Uploaded!");
      } catch (error) {
        throw new Error(parseErrorMessage(error.stdout));
      }
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
