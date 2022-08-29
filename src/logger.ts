import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";


export class Logger {
    logUri: vscode.Uri;
    logFolder: string = "";
    lfname: string = "";
    file_fullpath: string = "";
    message_count: number = 0;
    ready: boolean = false;
    setting: string = "";

    constructor(context: vscode.ExtensionContext) {
      this.logUri = context.globalStorageUri;  
    }

    async log(message: string, level: string = "info", timestamp: boolean = true) {
        if (!this.ready) return;
        if (!(vscode.workspace.getConfiguration("pros").get<boolean>(this.setting)??false)) return;

        this.message_count++;
        let full_message = ` ${timestamp? new Date().toISOString() : ""} | ${level.toUpperCase()} :: ${message}`;
        await fs.promises.appendFile(this.file_fullpath, full_message + "\n", {encoding: 'utf8'});
    }

    async init(logfile: string, timestamp_logfile_name: boolean = true, check_setting: string = "NA") { 
        this.logFolder = path.join(this.logUri.fsPath, "logs");
        this.lfname = `${logfile}${timestamp_logfile_name ? "_" + new Date().toISOString().replace(/:/gi, "-") : ""}.txt`;
        this.message_count = 0;
        this.file_fullpath = path.join(this.logFolder, this.lfname);
        this.setting = check_setting;

        fs.mkdirSync(this.logFolder, {recursive: true});
        
        this.ready = true;
    }
}


export class BackgroundProgress {
    title: string;
    cancellable: boolean;
    end: boolean = false;
    progress: number = 0;
    started_progress: boolean = false;
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