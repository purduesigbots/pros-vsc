// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class Button {
	statusBarItem: vscode.StatusBarItem;
	update: () => void;
	commandId?: string;
	callback?: (...args: any[]) => any;

	constructor(
		context: vscode.ExtensionContext,
		updater: () => void,
		commandId?: string,
		callback?: (...args: any[]) => any,
		alignment: vscode.StatusBarAlignment = vscode.StatusBarAlignment.Right,
		priority: number = 100
	) {
		console.log('constructing button');
		this.statusBarItem = vscode.window.createStatusBarItem(alignment, priority);
		if (commandId) {
			this.commandId = commandId;
			this.statusBarItem.command = this.commandId;

			if (callback) {
				context.subscriptions.push(
					vscode.commands.registerCommand(this.commandId, callback)
				);
			}
		}
		context.subscriptions.push(this.statusBarItem);
		this.update = updater.bind(this);
	}
}

let buttons: Button[];
let uploadButton: vscode.StatusBarItem;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// buttons.push(
	// 	new Button(
	// 		context,
	// 		function(this: Button) {
	// 			console.log(`hello from ${this}`);
	// 			this.statusBarItem.text = "$(desktop-download) Upload to robot";
	// 			this.statusBarItem.show();
	// 		},
	// 		'pros.upload',
	// 		() => {
	// 			// TODO: actually upload
	// 			vscode.window.showInformationMessage('upload button pressed');
	// 		}),
	// );
	context.subscriptions.push(vscode.commands.registerCommand('pros.upload', () => vscode.window.showInformationMessage('upload')));
	uploadButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	uploadButton.command = 'pros.upload';
	context.subscriptions.push(uploadButton);

	uploadButton.text = '$(desktop-download) Upload to robot';
	uploadButton.show();


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "pros" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('pros.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from pros!');
	});

	context.subscriptions.push(disposable);

	// tell all buttons to update for the first time
	// buttons.forEach((btn: Button) => btn.update());
}

// this method is called when your extension is deactivated
export function deactivate() { }
