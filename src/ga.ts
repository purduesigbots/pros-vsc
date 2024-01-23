import * as vscode from "vscode";
import * as ua from "universal-analytics";

const CID_KEY = "installed-packages:pros-vscode:ga-cid";
const GA_TID = "UA-84548828-7";

export class Analytics {
  public constructor(context: vscode.ExtensionContext) {
    if (
      !vscode.workspace
        .getConfiguration("pros")
        .get<boolean>("Enable Analytics")
    ) {
      // don't set the UA visitor if the user has turned off telemetry
      return;
    }

    const cid: string | ua.VisitorOptions | undefined =
      context.globalState.get(CID_KEY);
    if (!cid) {
      // We do not yet have a client ID for this install
      this.visitor = ua(GA_TID);
      context.globalState.update(CID_KEY, this.visitor.cid);
    } else {
      this.visitor = ua(GA_TID, cid);
    }

    this.startSession();
  }

  private readonly el = "pros-vscode";
  private readonly visitor: any;

  private startSession = () => {
    this.visitor
      ?.event("session", "start_session", this.el, 1, {
        sc: "start",
        nonInteraction: true,
        aip: true,
      })
      ?.send();
  };

  public endSession = () => {
    this.visitor
      ?.event("session", "end_session", this.el, 0, {
        sc: "end",
        nonInteraction: true,
        aip: true,
      })
      ?.send();
  };

  public sendAction = (type: string) => {
    this.visitor?.event("action", type, this.el);
  };

  public sendPageview = (page: string) => {
    this.visitor?.pageview(page, "https://pros.cs.purdue.edu", page)?.send();
  };
}
