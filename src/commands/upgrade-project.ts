import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import { gt } from "semver";

import { PREFIX, parseErrorMessage } from "./cli-parsing";
/**
 * Queries the PROS project data for the target device.
 *
 * @returns The project's target device and the associated library versions.
 */

const fetchTarget = async (): Promise<{
  target: string;
  curKernel: string;
  curOkapi: string | undefined;
}> => {
  // Command to run to fetch the current project that needs to be updated
  var command = `pros c info-project --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["VSCODE FLAGS"]}`;
  // console.log(command);
  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    env: {
      ...process.env,
      PATH: `"${process.env["PATH"]?.replace(/\\/g, "")}"`,
    },
  });

  // Get okapi and kernel version of current project
  for (let e of stdout.split(/\r?\n/)) {
    if (e.startsWith(PREFIX)) {
      let jdata = JSON.parse(e.substr(PREFIX.length));
      if (jdata.type === "finalize") {
        const target = jdata.data.project.target;
        const curKernel = jdata.data.project.templates.find(
          (t: any) => t.name === "kernel"
        ).version;
        const curOkapi = jdata.data.project.templates.find(
          (t: any) => t.name === "okapilib"
        ).version;
        return { target, curKernel, curOkapi };
      }
    }
  }
  return { target: "", curKernel: "", curOkapi: "" };
};

/**
 * Queries the server for the latest available library versions.
 *
 * @param target The target device for this project
 * @returns The kernel and okapi (if applicable) library versions
 */
const fetchServerVersions = async (
  target: string
): Promise<{ newKernel: string; newOkapi: string | undefined }> => {
  // Command to run to fetch latest okapi and kernel versions
  var command = `pros c q --target ${target} --machine-output ${process.env["VSCODE FLAGS"]}`;
  // console.log(command);
  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    env: {
      ...process.env,
      PATH: `"${process.env["PATH"]?.replace(/\\/g, "")}"`,
    },
  });

  let newKernel = "0.0.0";
  let newOkapi = "0.0.0";

  // Set current okapi and kernel versions
  for (let e of stdout.split(/\r?\n/)) {
    if (e.startsWith(PREFIX)) {
      let jdata = JSON.parse(e.substr(PREFIX.length));
      if (jdata.type === "finalize") {
        for (let ver of jdata.data) {
          if (ver.name === "kernel" && gt(ver.version, newKernel)) {
            newKernel = ver.version;
          } else if (ver.name === "okapilib" && gt(ver.version, newOkapi)) {
            newOkapi = ver.version;
          }
        }
      }
    }
  }

  return { newKernel, newOkapi };
};

/**
 * Actually performs the upgrade to the latest library versions for the project.
 */
const runUpgrade = async () => {
  // Command to run to upgrade project to a newer version
  var command = `pros c u --project "${vscode.workspace.workspaceFolders?.[0].uri.fsPath}" --machine-output ${process.env["VSCODE FLAGS"]}`;
  console.log(command);
  const { stdout, stderr } = await promisify(child_process.exec)(command, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50,
    env: {
      ...process.env,
      PATH: `"${process.env["PATH"]?.replace(/\\/g, "")}"`,
    },
  });

  const errorMessage = parseErrorMessage(stdout);
  if (errorMessage) {
    throw new Error(errorMessage);
  }
};

/**
 * Confirms with the user that the project should be updated to the specified library versions.
 *
 * @param kernel The new kernel version
 * @param okapi The new Okapilib version
 */
const userApproval = async (
  kernel: string | undefined,
  okapi: string | undefined
) => {
  // Ask for user confirmation before upgrading kernal and/or okapi version
  let title;
  if (kernel && okapi) {
    title = `Upgrade to kernel ${kernel} and Okapilib ${okapi}?`;
  } else if (kernel) {
    title = `Upgrade to Okapilib ${okapi}?`;
  } else {
    title = `Upgrade to kernel ${kernel}?`;
  }
  await vscode.window.showQuickPick(
    [{ label: "yes", description: "recommended" }, { label: "no" }],
    {
      placeHolder: "yes",
      canPickMany: false,
      title: title,
    }
  );
};

export const upgradeProject = async () => {
  try {
    const { target, curKernel, curOkapi } = await fetchTarget();
    const { newKernel, newOkapi } = await fetchServerVersions(target);
    if (curKernel === newKernel && curOkapi === newOkapi) {
      await vscode.window.showInformationMessage("Project is up to date!");
      return;
    }

    // check to see if the update is okay?
    await userApproval(
      newKernel === curKernel ? undefined : newKernel,
      newOkapi === curOkapi ? undefined : newOkapi
    );

    await runUpgrade();

    await vscode.window.showInformationMessage("Project updated!");
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
