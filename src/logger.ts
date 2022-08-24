import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";


export class Logger {
    logUri: vscode.Uri;
    logFolder: string;
    lfname: string;
    file_fullpath: string;
    message_count: number;
    ready: boolean = false;
    constructor(context: vscode.ExtensionContext, logfile: string, timestamp_logfile_name: boolean = true) {
        this.logUri = context.globalStorageUri;
        this.logFolder = path.join(this.logUri.fsPath, "logs");
        this.lfname = `${logfile}${timestamp_logfile_name ? "_" + new Date().toISOString().replace(/:/gi, "-") : ""}.txt`;
        this.message_count = 0;
        this.file_fullpath = path.join(this.logFolder, this.lfname);
        try {
            fs.statSync(this.logFolder);
        } catch(e:any){
            fs.mkdirSync(this.logFolder);
        }

        console.log(this.file_fullpath);

        fs.writeFile(this.file_fullpath, "", { flag: 'wx' }, function (err) {
            //if (err) throw err;
        });


        console.log(`LOG URI :::: ${this.file_fullpath}`);
        this.ready = true;
    }

    async log(message: string, level: string = "info", timestamp: boolean = true) {
        if (!this.ready) return;
        console.log("gotalog");
        this.message_count++;
        let full_message = ` ${timestamp? new Date().toISOString() : ""} | ${level.toUpperCase()} :: ${message}`;
        console.log('stuff happened probably');
        await fs.promises.appendFile(this.file_fullpath, full_message + "\n", {encoding: 'utf8'});
        console.log("wrote the message");
    }
}