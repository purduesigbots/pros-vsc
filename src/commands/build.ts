import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";
import { output } from "../extension";

/** Language IDs for C and C++ files */
const C_CPP_LANG_IDS = ["cpp", "c"];
/** Name of unsaved prompt setting  */
const PROMPT_CONFIG_NAME = "Prompt On Unsaved Files";

export const build = async () => {
  // TODO: Share this functionality with the build and upload command to avoid code duplication
  // TODO: If autosave is enabled, attempt to save all unsaved files in order to prevent edge cases with vscode's autosave.
  // TODO: Improve likelihood of user to find the "Enable Autosave" option

  /** Whether we should we prompt the user when files are unsaved. */
  const promptSetting = vscode.workspace
    .getConfiguration("pros")
    .get<boolean>(PROMPT_CONFIG_NAME);

  const isAutoSaveEnabled =
    vscode.workspace.getConfiguration("files").get<string>("autoSave") !==
    "off";

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
  if (unsavedUris.length > 0 && promptSetting) {
    // TODO: Move this function outside of the parent function
    function saveAll() {
      return Promise.all(unsavedUris.map((uri) => vscode.workspace.save(uri)));
    }

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
    const message = `${problem} This may cause problems with building.`;

    // TODO: Move type nonsense outside of the parent function
    // Define the possible user actions
    const basicActions = [
      multipleUnsaved ? "Save All" : "Save",
      "Abort",
      "Ignore",
    ] as const;
    const messageActions = [...basicActions, "More..."] as const;
    const quickPickAction = [
      ...basicActions,
      "Enable Autosave",
      "Don't Show Again",
    ] as const;

    type MessageUserAction = (typeof messageActions)[number];
    type QuickPickUserAction = (typeof quickPickAction)[number];
    type UserAction = MessageUserAction | QuickPickUserAction;

    const defaultAction: UserAction = "Ignore";

    // Show the message and get the user's action
    const action: MessageUserAction =
      (await vscode.window.showErrorMessage(
        message,
        ...messageActions
      )) /* If user presses x, default to Ignore */ ?? defaultAction;

    // TODO: Move this function outside of the parent function
    /**
     * Perform the user action.
     * @param action
     * @returns Whether build process was aborted.
     */
    async function performUserAction(action: UserAction) {
      switch (action) {
        case "Save":
        case "Save All":
          await saveAll();
          break;
        case "Enable Autosave":
          if (!isAutoSaveEnabled) {
            await vscode.commands.executeCommand(
              "workbench.action.toggleAutoSave"
            );
          }
          // If user enables autosave, we should also ensure to save all unsaved files
          await saveAll();
          break;
        case "Abort":
          return true;
        case "Ignore":
          break;
        case "Don't Show Again":
          vscode.workspace
            .getConfiguration("pros")
            .update(
              PROMPT_CONFIG_NAME,
              false,
              vscode.ConfigurationTarget.Global
            );
          break;
        case "More...":
          const quickPickItems: Array<
            { label: QuickPickUserAction } & vscode.QuickPickItem
          > = [
            {
              label: "Save",
              description:
                "Save all unsaved files and continue with build process.",
            },
            {
              label: "Abort",
              description: "Abort build process.",
            },
            {
              label: "Ignore",
              description:
                "Continue with build process without saving unsaved files.",
            },
            {
              label: "Don't Show Again",
              description:
                "Continue with build process and disable this warning in the future.",
            },
          ];
          if (!isAutoSaveEnabled) {
            quickPickItems.push({
              label: "Enable Autosave",
              description:
                "Continue with build process and enable vscode's autosave feature.",
            });
          }
          const newAction =
            (
              await vscode.window.showQuickPick(quickPickItems, {
                ignoreFocusOut: true,
              })
            )?.label ?? defaultAction;
          await performUserAction(newAction);
          break;
      }
      return false;
    }

    const shouldAbort = await performUserAction(action);
    if (shouldAbort) {
      return;
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
