import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class Logger {
  logUri: vscode.Uri;
  logFolder: string = "";
  lfname: string = "";
  fileFullpath: string = "";
  messageCount: number = 0;
  ready: boolean = false;
  setting: string = "";

  constructor(
    context: vscode.ExtensionContext,
    logfile: string,
    timestampLogfileName: boolean = true,
    checkSetting: string = "NA"
  ) {
    this.logUri = context.globalStorageUri;

    this.logFolder = path.join(this.logUri.fsPath, "logs");
    this.lfname = `${logfile}${
      timestampLogfileName
        ? "_" + new Date().toISOString().replace(/:/gi, "-")
        : ""
    }.txt`;
    this.messageCount = 0;
    this.fileFullpath = path.join(this.logFolder, this.lfname);
    this.setting = checkSetting;

    fs.mkdirSync(this.logFolder, { recursive: true });

    this.ready = true;
  }

  async log(
    category: string,
    message: string,
    level: string = "info",
    timestamp: boolean = true
  ) {
    if (
      !this.ready ||
      !(
        vscode.workspace.getConfiguration("pros").get<boolean>(this.setting) ??
        false
      )
    ) {
      return;
    }
    this.messageCount++;
    let fullMessage = `${category} | ${
      timestamp ? new Date().toISOString() : ""
    } | ${level.toUpperCase()} :: ${message}\n`;
    await fs.promises.appendFile(this.fileFullpath, fullMessage, {
      encoding: "utf8",
    });
  }

  async deleteLogs() {
    if (!this.ready) {
      return;
    }

    // get a list of logs in the log folder
    let logFiles = await fs.promises.readdir(this.logFolder);

    // delete all logs that are not the current log
    for (let file of logFiles) {
      if (file !== this.lfname) {
        await fs.promises.unlink(path.join(this.logFolder, file));
      }
    }
  }

  async deleteOldLogs() {
    if (!this.ready) {
      return;
    }

    let keep =
      (vscode.workspace
        .getConfiguration("pros")
        .get<number>("Log History Limit") ?? 60) * 864e5;
    let now = Date.now();

    let logFiles = await fs.promises.readdir(this.logFolder);

    for (let file of logFiles) {
      let stats = await fs.promises.stat(path.join(this.logFolder, file));
      if (now - stats.birthtimeMs > keep) {
        await fs.promises.unlink(path.join(this.logFolder, file));
      }
    }
  }

  async openLog() {
    // get a list of logs in the log folder
    if (!this.ready) {
      return;
    }
    let logFiles = await fs.promises.readdir(this.logFolder);

    //generate a vscode quickpick using the list of files
    let logOptions: Array<vscode.QuickPickItem> = logFiles.map((file) => {
      return { label: file, description: "" };
    });

    let logSelection = await vscode.window.showQuickPick(logOptions, {
      title: "Select a PROS log to open",
    });

    //open the log in vscode
    if (logSelection) {
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.file(path.join(this.logFolder, logSelection.label))
      );
    }
  }
}

export class BackgroundProgress {
  title: string | undefined;
  cancellable: boolean;
  end: boolean = false;
  progress: number = 0;
  startedProgress: boolean = false;
  token: vscode.CancellationToken | undefined;
  constructor(
    title: string | undefined,
    cancel: boolean = false,
    autostart: boolean = false
  ) {
    this.title = title;
    this.cancellable = cancel;
    if (autostart) {
      this.start();
    }
  }

  async start() {
    if (this.title === undefined) {
      return;
    }
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: this.title,
        cancellable: this.cancellable,
      },
      async (progress, token) => {
        this.token = token;
        while (!this.end) {
          if (this.progress > 0) {
            progress.report({ increment: this.progress });
            this.progress = 0;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    );
  }

  stop = async () => {
    if (this.title === undefined) {
      return;
    }
    this.end = true;
  };
  increment = async (amount: number) => {
    if (this.title === undefined) {
      return;
    }
    this.progress += amount;
  };
}
