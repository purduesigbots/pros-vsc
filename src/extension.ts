import * as vscode from 'vscode';
import * as child_process from 'child_process';
import {promisify} from 'util';
import * as path from 'path';
import * as fs from 'fs';

import { uploadProject, createNewProject } from '@purduesigbots/pros-cli-middleware';
import { TreeDataProvider } from './views/tree-view';
import { getWebviewContent } from './views/welcome-view';
import { utils } from 'mocha';

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
		// TODO: fetch the kernel versions first
		const kernelOptions: vscode.QuickPickOptions = {
			placeHolder: "latest",
			title: "Select the project version"
		};
		const version = await vscode.window.showQuickPick(["latest", "3.1.3"], kernelOptions);
		if (version === undefined) {
			return;
		}

		// TODO: install libraries question?

		// create project
		console.log(projectName);
		const projectPath = path.join(uri, projectName);
		console.log(projectPath);
		await fs.promises.mkdir(projectPath, {recursive: true});
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification, 
			title: "Downloading libraries", 
			cancellable: false
		}, async (progress, token) => {
			const PREFIX = 'Uc&42BWAaQ';

			return new Promise<void>(async resolve => { 
				try {
					const { stdout, stderr } = await promisify(child_process.exec)(`pros c n ${projectPath} --machine-output`, {encoding: 'utf8', maxBuffer: 1024 * 1024 * 5});

					for (let e of stderr.split(/\r?\n/)) {
						console.log(e);
						vscode.window.showErrorMessage(e);
						resolve();
					}

					vscode.window.showInformationMessage("Project created!");
					resolve();
				} catch (error) {
					console.error(error.stdout);
					for (let e of error.stdout.split(/\r?\n/)) {
						if (!e.startsWith(PREFIX)) {
							continue;
						}

						let jdata = JSON.parse(e.substr(PREFIX.length));
						let [primary] = jdata.type.split('/');
						if (primary === "log" && jdata.level === "ERROR") {
							vscode.window.showErrorMessage(jdata.simpleMessage);
							resolve();
						}
					}
					resolve();
				}
				
				// seems like actually parsing the data as it is coming in is problematic. Will stick with the generic rotating progress bar as a result
			});
		});

		// TODO: Open the new workspace
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
