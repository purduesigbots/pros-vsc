import * as vscode from "vscode";

/*
we need to create a class that will create a quickpick prompt for multiple options.
Eg. there will be a tree item called "Manage PROS" that when pressed will open a quickpick for the user to choose between
installing, uninstalling, or verifying PROS.


*/

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined;

  data: TreeItem[];

  constructor() {
    this.data = [
      new TreeItem("Quick Actions", [
        new TreeItem("Build & Upload", undefined, "pros.build&upload"),
        new TreeItem("Upload", undefined, "pros.upload"),
        new TreeItem("Build", undefined, "pros.build"),
        new TreeItem("Clean", undefined, "pros.clean"),
        new TreeItem("Integrated Terminal", undefined, "pros.showterminal"),
      ]),
      new TreeItem("V5 Brain", [
        new TreeItem("Brain Terminal", undefined, "pros.terminal"),
        new TreeItem("Capture Image", undefined, "pros.capture"),
        new TreeItem("Set Team Number", undefined, "pros.teamnumber"),
        new TreeItem("Set Robot Name", undefined, "pros.robotname"),
        new TreeItem("Battery Medic", undefined, "pros.batterymedic"),
        new TreeItem("Update VEXos", undefined, "pros.updatefirmware"),
      ]),
      new TreeItem("Conductor", [
        new TreeItem("Upgrade Project", undefined, "pros.upgrade"),
        new TreeItem("Create Project", undefined, "pros.new"),
        // open branchline will go here in the future
      ]),
      new TreeItem("Manage Installations", [
        new TreeButtonMultiSelect("Manage PROS", "pros.manageInstallation", [
          [
            "Install PROS",
            "pros.install",
            "Installs the latest version of the PROS CLI, PROS Toolchain, and VEX vexcom utility",
          ],
          [
            "Uninstall PROS",
            "pros.uninstall",
            "Uninstalls the PROS CLI, PROS Toolchain, and VEX vexcom utility",
          ],
          [
            "Verify PROS Installation",
            "pros.verify",
            "Verifies that the PROS CLI, PROS Toolchain, and VEX vexcom utility are installed, up to date, and functional",
          ],
        ]),
        new TreeButtonMultiSelect("Vision Utility", "pros.manageVision", [
          [
            "Install Vision Utility",
            "pros.installVision",
            "Installs the latest version of the VEX Vision Utility",
          ],
          [
            "Uninstall Vision Utility",
            "pros.uninstallVision",
            "Uninstalls the VEX Vision Utility",
          ],
          [
            "Run Vision Utility",
            "pros.runVision",
            "Runs the VEX Vision Utility",
          ],
        ]),
      ]),
    ];
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: TreeItem | undefined
  ): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined;

  constructor(label: string, children?: TreeItem[], command?: string) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    if (command !== undefined) {
      this.command = {
        title: label,
        command,
      };
    }
    this.children = children;
  }
}

export class TreeButtonMultiSelect extends TreeItem {
  // options should be a list of 2 element tuples, where the first element is the name of the option and the second is the command to run, and an optional third element that is the description of the option
  constructor(name: string, cmd: string, options: [string, string, string?][]) {
    vscode.commands.registerCommand(cmd, () => {
      // show the quickpick with descriptions
      vscode.window
        .showQuickPick(
          options.map((option) => {
            return {
              label: option[0],
              description: option[2],
            };
          }),
          {
            placeHolder: name,
          }
        )
        .then((option) => {
          if (option !== undefined) {
            vscode.commands.executeCommand(option.label);
          }
        });
    });

    super(name, undefined, cmd);
  }
}
