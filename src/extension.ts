import * as vscode from 'vscode';
import { uploadProject } from '@purduesigbots/pros-cli-middleware';
import { TreeDataProvider } from './views/tree-view';
import { getWebviewContent } from './views/welcome-view';

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.registerCommand('pros.helloWorld', () => vscode.window.showInformationMessage('Hello World from pros!'));
	// vscode.commands.registerCommand('pros.upload', () => uploadProject(undefined, vscode.workspace.workspaceFolders[0].uri.path));
	vscode.commands.registerCommand('pros.upload', () => vscode.window.setStatusBarMessage('Uploading...', 5000));

	vscode.commands.registerCommand('pros.welcome', () => {
		const panel = vscode.window.createWebviewPanel(
			'welcome',
			'Welcome',
			vscode.ViewColumn.One,
			{}
		);
		panel.webview.html = getWebviewContent();
	});

	vscode.window.registerTreeDataProvider('prosTreeview', new TreeDataProvider());
}

export function deactivate() { }
