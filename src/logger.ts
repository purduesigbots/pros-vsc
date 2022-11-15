import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { removeDirAsync } from "./one-click/install";

export class Logger {
    logUri: vscode.Uri;
    logFolder: string = "";
    lfname: string = "";
    file_fullpath: string = "";
    message_count: number = 0;
    ready: boolean = false;
    setting: string = "";

    constructor(context: vscode.ExtensionContext, logfile: string, timestamp_logfile_name: boolean = true, check_setting: string = "NA") {
        this.logUri = context.globalStorageUri;  

        this.logFolder = path.join(this.logUri.fsPath, "logs");
        this.lfname = `${logfile}${timestamp_logfile_name ? "_" + new Date().toISOString().replace(/:/gi, "-") : ""}.txt`;
        this.message_count = 0;
        this.file_fullpath = path.join(this.logFolder, this.lfname);
        this.setting = check_setting;

        fs.mkdirSync(this.logFolder, {recursive: true});
        
        this.ready = true;
    }

    async log(category: string, message: string, level: string = "info", timestamp: boolean = true) {
        if (!this.ready) return;
        if (!(vscode.workspace.getConfiguration("pros").get<boolean>(this.setting)??false)) return;
        this.message_count++;
        let full_message = `${category} | ${timestamp? new Date().toISOString() : ""} | ${level.toUpperCase()} :: ${message}\n`;
        await fs.promises.appendFile(this.file_fullpath, full_message, {encoding: 'utf8'});
    }

    async deleteLogs() {
        if (!this.ready) return;

        // get a list of logs in the log folder
        let log_files = await fs.promises.readdir(this.logFolder);

        // delete all logs that are not the current log
        for (let file of log_files) {
            if (file != this.lfname) {
                await fs.promises.unlink(path.join(this.logFolder, file));
            }
        }
    }

    async openLog() {
        // get a list of logs in the log folder
        if (!this.ready) return;
        let log_files = await fs.promises.readdir(this.logFolder);
        
        //generate a vscode quickpick using the list of files
        let log_options: Array<vscode.QuickPickItem> = log_files.map(file => {return {label: file, description: ""}});

        let log_selection = await vscode.window.showQuickPick(log_options, {title: "Select a PROS log to open"});

        //open the log in vscode
        if (log_selection) {
            vscode.commands.executeCommand("vscode.open", vscode.Uri.file(path.join(this.logFolder, log_selection.label)));
        }
    }
}


export class BackgroundProgress {
    title: string;
    cancellable: boolean;
    end: boolean = false;
    progress: number = 0;
    started_progress: boolean = false;
    token: vscode.CancellationToken | undefined;
    constructor(title: string, cancel: boolean = false, autostart: boolean = false) {
        this.title = title;
        this.cancellable = cancel;
        if(autostart) this.start();
    }

    async start () {
        vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: this.title,
                cancellable: this.cancellable
            },
            async(progress, token) => {
                this.token = token;
                const loop = async() => {
                    if(this.end) return;
                    if(this.progress > 0) {
                        progress.report({increment: this.progress});
                        this.progress = 0;
                    }
                    setTimeout(loop, 50);
                }
            }
        );
    }

    stop = async() => {
        this.end = true;
    }
    increment = async(amount: number) => {
        this.progress += amount;
    }
}