import * as vscode from 'vscode';

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
	onDidChangeTreeData?: vscode.Event<TreeItem | null | undefined> | undefined;

	data: TreeItem[];

	constructor() {
		this.data = [new TreeItem('Quick Actions', [new TreeItem('Upload & Build', undefined, 'pros.upload&build'), new TreeItem('Upload', undefined, 'pros.upload'), new TreeItem('Build', undefined, 'pros.build'), new TreeItem('Clean', undefined, 'pros.clean')]),
		new TreeItem('Debug', [new TreeItem('Open Terminal', undefined, 'pros.terminal')]),
		new TreeItem('Conductor', [new TreeItem('Upgrade Project', undefined, 'pros.upgrade')])];
	}

	getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
		if (element === undefined) {
			return this.data;
		}
		return element.children;
	}
}

class TreeItem extends vscode.TreeItem {
	children: TreeItem[] | undefined;

	constructor(label: string, children?: TreeItem[], command?: string,) {
		super(
			label,
			children === undefined ? vscode.TreeItemCollapsibleState.None :
				vscode.TreeItemCollapsibleState.Expanded);
		if (command != undefined) {
			this.command = {
				title: label,
				command
			};
		}
		this.children = children;
	}
}