
import * as vscode from 'vscode';
import { uploadProject } from '@purduesigbots/pros-cli-middleware';


export function activate(context: vscode.ExtensionContext) {

	vscode.commands.registerCommand('pros.helloWorld', () => vscode.window.showInformationMessage('Hello World from pros!'));
	//  vscode.commands.registerCommand('pros.upload', () => uploadProject);
	vscode.commands.registerCommand('pros.welcome', () => {
		// Create and show panel
		const panel = vscode.window.createWebviewPanel(
		  'welcome',
		  'Welcome',
		  vscode.ViewColumn.One,
		  {}
		);
  
		// And set its HTML content
		panel.webview.html = getWebviewContent();
	});

	vscode.window.registerTreeDataProvider('prosTreeview', new TreeDataProvider());
}

function getWebviewContent() {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Welcome</title>
  </head>
  <body>
	  <img src="https://pros.cs.purdue.edu/_static/img/pros-tux.png" width="600" class="center"/>
	  <h1 className="title">
              Open Source C/C++ Development for VEX V5 and VEX Cortex
      </h1>
	  <section className="panel">
	  <p>For help, please visit:</p>
	  <ul>
		<li>
		  <a href='https://pros.cs.purdue.edu/v5/getting-started/new-users.html'>
			This Page
		  </a>
		  for a guide to getting started with PROS for Atom.
		</li>

		<li>
		  The
		  <a href='https://pros.cs.purdue.edu/v5/tutorials/index.html'>
			PROS tutorial page
		  </a>
		  to learn about using everything from sensors to motors to tasks
		  and multithreading in PROS.
		</li>

		<li>
		  The
		  <a href='https://pros.cs.purdue.edu/v5/api/index.html'>
			PROS API documentation
		  </a>
		</li>
	  </ul>
  </body>
  </html>`;
}
  
  export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
	onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;
  
	data: TreeItem[];
  
	constructor() {
		this.data = [new TreeItem('Quick Actions', [new TreeItem('Upload & Build', undefined, 'pros.upload&build'), new TreeItem('Upload', undefined, 'pros.upload'), new TreeItem('Build', undefined, 'pros.build'), new TreeItem('Clean', undefined, 'pros.clean')]), 
					 new TreeItem('Debug', [new TreeItem('Open Terminal', undefined, 'pros.terminal')]), 
					 new TreeItem('Conductor', [new TreeItem('Upgrade Project', undefined, 'pros.upgrade')])];
	}
  
	getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
	  return element;
	}
  
	getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
	  if (element === undefined) {
		return this.data;
	  }
	  return element.children;
	}
  }
  
  class TreeItem extends vscode.TreeItem {
	children: TreeItem[]|undefined;
  
	constructor(label: string, children?: TreeItem[], command?: string, ) {
	  super(
		  label,
		  children === undefined ? vscode.TreeItemCollapsibleState.None :
								   vscode.TreeItemCollapsibleState.Expanded);
		if(command != undefined) {
			this.command = {
				title: label,
				command
			};
		}
		this.children = children;
	}
  }

  export function deactivate() {}
