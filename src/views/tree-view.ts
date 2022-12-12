import * as vscode from "vscode";

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
        new TreeItem("Run", undefined, "pros.run"),
        new TreeItem("Stop", undefined, "pros.stop"),
        new TreeItem("Brain Terminal", undefined, "pros.terminal"),
        new TreeItem("Integrated Terminal", undefined, "pros.showterminal"),
        new TreeItem("Capture Image", undefined, "pros.capture"),
        new TreeItem("Set Team Number", undefined, "pros.teamnumber"),
        new TreeItem("Set Robot Name", undefined, "pros.robotname"),
      ]),
      new TreeItem("Conductor", [
        new TreeItem("Upgrade Project", undefined, "pros.upgrade"),
        new TreeItem("Create Project", undefined, "pros.new"),
      ]),
      new TreeItem("Other", [
        new TreeItem("Install PROS", undefined, "pros.install"),
        new TreeItem("Uninstall PROS", undefined, "pros.uninstall"),
        new TreeItem("Verify PROS Installation", undefined, "pros.verify"),
        new TreeItem("Update VEXos", undefined, "pros.updatefirmware"),
        new TreeItem("Battery Medic", undefined, "pros.batterymedic"),
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
