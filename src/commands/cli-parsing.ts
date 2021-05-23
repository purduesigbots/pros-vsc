export const PREFIX = "Uc&42BWAaQ";

/**
 * Finds the logging message that contains the error message.
 *
 * @param error The error thrown by the Node child process
 * @returns A user-friendly message to display
 */
export const parseErrorMessage = (stdout: any) => {
  for (let e of stdout.split(/\r?\n/)) {
    if (!e.startsWith(PREFIX)) {
      continue;
    }

    let jdata = JSON.parse(e.substr(PREFIX.length));
    if (jdata.type.startsWith("log") && jdata.level === "ERROR") {
      return jdata.simpleMessage;
    }
  }
};
