import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { getOperatingSystem } from "./install";

// Returns the path to the PROS CLI and PROS toolchain.
// These paths should only be used in the integrated terminal, for some unknown
// reason the spaces in the paths need to be escaped differently when running
// outside the integrated terminal.
export const getIntegratedTerminalPaths = (
  context: vscode.ExtensionContext
): [string, string, string] => {
  const globalPath = context.globalStorageUri.fsPath;
  const system = getOperatingSystem();

  // path to cli
  let cliExecPath = `${path.join(globalPath, "install", `pros-cli-${system}`)}`;

  // path to toolchain
  let toolchainPath = path.join(
    globalPath,
    "install",
    `pros-toolchain-${
      system === "windows" ? path.join("windows", "usr") : system
    }`
  );

  let vexcomPath = path.join(globalPath, "install", `vex-vexcom-${system}`);

  if (system === "macos" && !os.cpus()[0].model.includes("Apple M")) {
    // Escape spaces in paths on Intel Mac
    cliExecPath = cliExecPath.replace(/(\s+)/g, "\\$1");
    toolchainPath = toolchainPath.replace(/(\s+)/g, "\\$1");
    vexcomPath = vexcomPath.replace(/(\s+)/g, "\\$1");
  }

  return [cliExecPath, toolchainPath, vexcomPath];
};

// Returns the path to the PROS CLI.
// This path should only be used in `child_process.exec` calls, not the
// integrated terminal.
export const getChildProcessPath = (): string | undefined => {
  let path = process.env["PATH"];
  if (getOperatingSystem() === "macos") {
    path = `"${path?.replace(/\\/g, "")}"`;
  }
  return path;
};

// Returns the path to the PROS Toolchain.
// This path should only be used in `child_process.exec` calls, not the
// integrated terminal.
export const getChildProcessProsToolchainPath = (): string | undefined => {
  let toolchainPath = process.env["PROS_TOOLCHAIN"];
  if (getOperatingSystem() === "macos") {
    toolchainPath = `${toolchainPath?.replace(/\\/g, "")}`;
  }
  return toolchainPath;
};
