import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import { output } from "../extension";

/** Language IDs for C and C++ files */
const C_CPP_LANG_IDS = ["cpp", "c"];

export const build = async () => {
  // TODO: Share this functionality with the build and upload command
  // TODO: Suggest autosave somehow.
  // TODO: If autosave is enabled, attempt to save all unsaved files in order to prevent edge cases with vscode's autosave.

  /** Unsaved document uris likely belonging to the user's program's source code. */
  const unsavedUris = vscode.workspace.textDocuments
    .filter(
      (doc) =>
        doc.isDirty &&
        C_CPP_LANG_IDS.includes(doc.languageId) &&
        doc.uri.scheme !== "untitled"
    )
    .map((doc) => doc.uri);

  // If there are unsaved files, prompt the user to save them
  if (unsavedUris.length > 0) {
    const multipleUnsaved = unsavedUris.length > 1;

    // Change the message based on whether there are multiple unsaved files
    let problem: string;
    if (multipleUnsaved) {
      problem = "Multiple files are not saved!";
    } else {
      const relativeFilePath = vscode.workspace.asRelativePath(unsavedUris[0]);
      problem = `[${relativeFilePath}](${unsavedUris[0]}) is not saved!`;
    }

    // TODO: Add a link to some documentation?
    const message = `${problem} This may cause problems with building. [Learn more](https://pros.cs.purdue.edu/)`;

    // Show the message and get the user's response
    const response = await vscode.window.showErrorMessage(
      message,
      multipleUnsaved ? "Save All" : "Save",
      "Abort",
      "Ignore",
      "Don't Ask Again"
    );

    // Handle user response
    switch (response) {
      case "Save":
      case "Save All":
        await Promise.all(unsavedUris.map((uri) => vscode.workspace.save(uri)));
        break;
      case "Abort":
        return;
      // User pressed the 'x' button on the message
      case undefined:
      case "Ignore":
        break;
      case "Don't Ask Again":
        output.appendLine(
          "User chose to ignore unsaved files warning for PROS build."
        );
        // TODO: add setting to disable this warning
        break;
    }
  }
  const buildCommandOptions: BaseCommandOptions = {
    command: "pros",
    args: ["make"],
    message: "Building Project",
    requiresProsProject: true,
    successMessage: "Project Built Successfully",
  };
  const buildCommand: BaseCommand = new BaseCommand(buildCommandOptions);
  try {
    await buildCommand.runCommand();
  } catch (err: any) {
    await vscode.window.showErrorMessage(err.message);
  }
};
