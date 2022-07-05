export const PREFIX = "Uc&42BWAaQ";
import { output } from '../extension';
/**
 * Finds the logging message that contains the error message.
 *
 * @param error The error thrown by the Node child process
 * @returns A user-friendly message to display
 */
export const ansi_regex = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
'g');
export const parseMakeOutput = (stdout: any) => {
  const errorSplit = stdout.split(/\r?\n/);
  for (let e of errorSplit) {
    if (!e.startsWith(PREFIX)) {
      continue;
    }

    let jdata = JSON.parse(e.substr(PREFIX.length));
    if (jdata.type.startsWith("log") && jdata.level === "ERROR") {
      return jdata.simpleMessage;
    }
    else if (jdata.type.startsWith("notify") && String(jdata.text).includes("ERROR")) {
      var errors = false;
      output.appendLine('\n********************************\n');
      for (let err of errorSplit) {
        if(err.substr(PREFIX.length).startsWith("{\"text")) {
          e = JSON.parse(err.substr(PREFIX.length)).text
          output.appendLine(e.replace(
            ansi_regex,
            ''
          ));
          errors = true;
        }
      }
      return "Build Failed! See PROS output for details!"
    }
  }
}

export const parseErrorMessage = (stdout: any) => {
  const errorSplit = stdout.split(/\r?\n/);
  let err = "NOERROR";
  for (let e of errorSplit) {
    if (!e.startsWith(PREFIX)) {
      continue;
    }
    let jdata = JSON.parse(e.substr(PREFIX.length));
    if (jdata.type.startsWith("log") && jdata.level === "ERROR") {
      console.log(jdata.simpleMessage);
      err = jdata.simpleMessage;
    }
  }
  return err;
};