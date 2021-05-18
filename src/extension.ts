import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { uploadProject, createNewProject } from '@purduesigbots/pros-cli-middleware';
import { TreeDataProvider } from './views/tree-view';
import { getWebviewContent } from './views/welcome-view';

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.registerCommand('pros.helloWorld', () => vscode.window.showInformationMessage('Hello World from pros!'));
	const terminal = vscode.window.createTerminal('PROS Terminal');
	// terminal.sendText("pros build-compile-commands");

	vscode.commands.registerCommand('pros.upload&build', () => {
		terminal.show();
		terminal.sendText("pros mu");
	});

	vscode.commands.registerCommand('pros.upload', () => {
		terminal.show();
		terminal.sendText("pros upload");
	});

	vscode.commands.registerCommand('pros.build', () => {
		terminal.show();
		terminal.sendText("pros make");
	});

	vscode.commands.registerCommand('pros.clean', () => {
		terminal.show();
		terminal.sendText("pros make clean");
	});

	vscode.commands.registerCommand('pros.terminal', () => {
		terminal.show();
		terminal.sendText("pros terminal");
	});

	vscode.commands.registerCommand('pros.upgrade', () => {
		terminal.show();
		terminal.sendText("pros conduct upgrade");
	});

	vscode.commands.registerCommand('pros.new', async () => {
		// directory selection dialog
		const directoryOptions: vscode.OpenDialogOptions = {
			canSelectMany: false,
			title: "Select a directory where the PROS Project will be created",
			openLabel: "Create Project Here",
			canSelectFolders: true,
			canSelectFiles: false
		};
		const uri: string | undefined = await vscode.window.showOpenDialog(directoryOptions).then((uri) => {
			return uri ? uri[0].fsPath : undefined;
		});
		if (uri === undefined) {
			// error msg
			return;
		}

		// select target
		const targetOptions: vscode.QuickPickOptions = {
			placeHolder: "v5",
			title: "Select the target device"
		};
		const platform = await vscode.window.showQuickPick(["v5", "cortex"], targetOptions);
		if (platform === undefined) {
			return;
		}

		// set project name
		const projectNameOptions: vscode.InputBoxOptions = {
			prompt: "Project Name",
			placeHolder: "my-pros-project"
		};
		let projectName = await vscode.window.showInputBox(projectNameOptions);
		if (!projectName) {
			projectName = "my-pros-project";
		}

		// set kernel version
		const kernelOptions: vscode.QuickPickOptions = {
			placeHolder: "latest",
			title: "Select the project version"
		};
		const version = await vscode.window.showQuickPick(["latest", "3.1.3"], kernelOptions);
		if (version === undefined) {
			return;
		}

		// install default libraries
		// await createNewProject({
		// 	notify: () => {},
		// 	log: () => {},
		// 	prompt: () => {},
		// 	finalize: (data) => {
		// 		vscode.window.showInformationMessage(`${data}`);
		// 	},
		// 	input: () => {},
		// }, uri, version, platform).then((code) => {
		// 	vscode.window.showInformationMessage(`Here: ${code}`);
		// }).catch((error) => {
		// 	vscode.window.showInformationMessage(`Fail: ${error}`);
		// });
		console.log(projectName);
		const projectPath = path.join(uri, projectName);
		console.log(projectPath);
		await fs.promises.mkdir(projectPath, {recursive: true});
		child_process.exec(`pros c n ${projectPath} --machine-output`, (err, stdout, stderr) => {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (err) {
				console.log('error: ' + err);
			}
		});
	});

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
