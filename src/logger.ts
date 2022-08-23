import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class Logger {
    logUri: vscode.Uri;
    lfname: string;
    file_fullpath: string;
    message_count: number;

    constructor(context: vscode.ExtensionContext, logfile: string, timestamp_logfile_name: boolean = true) {
        this.logUri = context.logUri;
        this.lfname = `${timestamp_logfile_name ? `${logfile}_${new Date().toISOString()}` : logfile}.log`;
        this.message_count = 0;
        this.file_fullpath = path.join(this.logUri.fsPath, this.lfname);

        if(!fs.existsSync(this.file_fullpath)) {
            fs.writeFileSync(this.file_fullpath, "");
        }

        console.log(`LOG URI :::: ${this.file_fullpath}`);
    }

    async log(message: string, level: string = "info", timestamp: boolean = true) {
        this.message_count++;
        let full_message = `${timestamp? new Date().toISOString() : ""} | ${level.toUpperCase()} :: ${message}`;
        fs.writeFileSync(this.file_fullpath, full_message + "\n", { flag: "a" });
    }
}