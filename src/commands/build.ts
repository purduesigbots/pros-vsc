import * as vscode from "vscode";
import { BaseCommand, BaseCommandOptions } from "./base-command";

// TODO: Share prompt on unsaved files functionality with the build and upload command to avoid code duplication
// TODO: Improve likelihood of user to find the "Enable Autosave" option
// TODO: Look into impact on other commands - does this prevent other commands from running?

type UserAction = Omit<vscode.MessageItem, "title"> &
  vscode.QuickPickItem & {
    /** Serves as title for message item and label for quick pick item. */
    label: string;
    /** Whether to display in message. Defaults to false. */
    inMessage?: boolean;
    /** Whether to display in quick pick. Defaults to false. */
    inQuickPick?: boolean;
    /** This action will be used if no other action is selected. Defaults to false. */
    isDefault?: boolean;
  };

// Define the possible user actions for the unsaved files prompt
const unsavedFilesActions = [
  {
    label: "Save",
    description: "Save all unsaved files and continue with build process.",
    inMessage: true,
    inQuickPick: true,
  },
  {
    label: "Ignore",
    description: "Continue with build process without saving unsaved files.",
    inMessage: true,
    inQuickPick: true,
    isDefault: true,
  },
  {
    label: "Abort",
    description: "Abort build process.",
    inMessage: true,
    inQuickPick: true,
  },
  {
    label: "More...",
    inMessage: true,
  },
  {
    label: "Enable Autosave",
    description:
      "Continue with build process and enable vscode's autosave feature.",
    inQuickPick: true,
  },
  {
    label: "Don't Show Again",
    description:
      "Continue with build process and disable this warning in the future.",
    inQuickPick: true,
  },
] as const satisfies UserAction[];

type UnsavedFilesAction = (typeof unsavedFilesActions)[number];

function getAction<Arr extends UserAction[], L extends string>(
  actions: Arr,
  label: L
): Arr[number] & { label: L } {
  return actions.find(
    (act): act is Arr[number] & { label: L } => act.label === label
  )!;
}

type PromptUserActionOptions<A extends UserAction> = {
  possibleActions: A[];
  /** Determines whether user has previously asked to never be shown this prompt again. */
  isPromptEnabled?: () => Thenable<boolean>;
} & (
  | {
      method: "message";
      level: "error" | "warning" | "info";
      options?: vscode.MessageOptions;
      message: string;
    }
  | { method: "quick_pick"; options?: vscode.QuickPickOptions }
);

/**
 * Prompts the user to select an action
 * @template A Possible actions
 * @returns User select action
 */
async function promptUserAction<A extends UserAction>(
  opts: PromptUserActionOptions<A>
): Promise<A> {
  const { possibleActions: actions, method } = opts;
  /** Action to be used if user does not respond for any reason. */
  const defaultAct =
    actions.find((act) => ("isDefault" in act ? act.isDefault : false)) ??
    actions[0];

  /** Whether we should we prompt the user when files are unsaved. */
  const promptSetting = (await opts.isPromptEnabled?.()) ?? true;
  if (promptSetting === false) {
    return defaultAct;
  }
  switch (method) {
    case "message": {
      const showMessage = {
        error: vscode.window.showErrorMessage,
        warning: vscode.window.showWarningMessage,
        info: vscode.window.showInformationMessage,
      }[opts.level];
      const items = actions
        .filter((act) => ("inMessage" in act ? act.inMessage : false))
        .map((act) => {
          return { title: act.label, ...act };
        });
      return (
        (await showMessage(opts.message, opts.options ?? {}, ...items)) ??
        defaultAct
      );
    }
    case "quick_pick": {
      const items = actions.filter((act) =>
        "inQuickPick" in act ? act.inQuickPick : false
      );
      return (
        (await vscode.window.showQuickPick(items, opts.options ?? {})) ??
        defaultAct
      );
    }
  }
}

/**
 * Saves all unsaved URIs.
 * If saving fails, inform user, and prompt the user to select an action.
 * @returns Failed uris
 */
async function saveAll(unsavedUris: vscode.Uri[]): Promise<vscode.Uri[]> {
  let failedUris: vscode.Uri[] = [];
  const promises = unsavedUris.map(async (uri) => {
    if ((await vscode.workspace.save(uri)) === undefined) {
      failedUris.push(uri);
    }
  });
  await Promise.all(promises);
  return failedUris;
}

/** Language IDs for C and C++ files */
const C_CPP_LANG_IDS = ["cpp", "c"];
/** Name of unsaved prompt setting  */
const UNSAVED_FILES_PROMPT_CONFIG = "Prompt On Unsaved Files";

function isPromptEnabled(configName: string): Thenable<boolean> {
  return Promise.resolve(
    vscode.workspace.getConfiguration("pros").get<boolean>(configName) ?? false
  );
}

const isUnsavedFilesPromptEnabled = () =>
  isPromptEnabled(UNSAVED_FILES_PROMPT_CONFIG);

type PromptAndPerformUnsavedFilesActionOptions =
  PromptUserActionOptions<UnsavedFilesAction> & {
    unsavedUris: vscode.Uri[];
  };

/**
 * Prompts the user to select an action, and performs said action.
 * @returns Whether build process should be aborted.
 */
async function promptAndPerformUnsavedFilesAction(
  opts: PromptAndPerformUnsavedFilesActionOptions
): Promise<boolean> {
  const { unsavedUris, possibleActions } = opts;
  const action = await promptUserAction({
    isPromptEnabled: isUnsavedFilesPromptEnabled,
    ...opts,
  });
  return performUnsavedFilesAction({ ...opts, action });
}

interface PerformUnsavedFilesActionOptions {
  action: UnsavedFilesAction;
  possibleActions: UnsavedFilesAction[];
  unsavedUris: vscode.Uri[];
}

/**
 * Perform the user action.
 * @param action
 * @returns Whether build process should be aborted.
 */
async function performUnsavedFilesAction(
  opts: PerformUnsavedFilesActionOptions
): Promise<boolean> {
  const { action, unsavedUris, possibleActions } = opts;
  switch (action.label) {
    case "Enable Autosave":
      await vscode.commands.executeCommand("workbench.action.toggleAutoSave");
    // If user enables autosave, we should also ensure to save all unsaved files (pass through)
    case "Save": {
      const failedUris = await saveAll(unsavedUris);
      if (failedUris.length === 0) {
        return false;
      }

      // Prompt user if saving failed
      const shortMessage = `Failed to save ${failedUris.length} files`;
      let longMessage = `${shortMessage}: `;
      /** Printed markdown length, rather than plaintext length  */
      let length = longMessage.length;
      longMessage += failedUris
        .map((uri) => {
          const relativeFilePath = vscode.workspace.asRelativePath(uri);
          length += relativeFilePath.length;
          return `[${relativeFilePath}](${uri})`;
        })
        .join(", ");
      // Shorten message if it's too long (100 was chosen arbitrarily)
      const message = longMessage.length < 100 ? longMessage : shortMessage;
      // Remove save action and enable autosave, as they cannot solve the problem
      const newPossibleActions = possibleActions.filter(
        (act) => !["Save", "Enable Autosave"].includes(act.label)
      );
      return await promptAndPerformUnsavedFilesAction({
        ...opts,
        possibleActions: newPossibleActions,
        method: "message",
        level: "error",
        message,
      });
    }
    case "Abort":
      return true;
    case "Ignore":
      break;
    case "Don't Show Again":
      vscode.workspace
        .getConfiguration("pros")
        .update(
          UNSAVED_FILES_PROMPT_CONFIG,
          false,
          vscode.ConfigurationTarget.Global
        );
      break;
    case "More...":
      return await promptAndPerformUnsavedFilesAction({
        ...opts,
        possibleActions,
        method: "quick_pick",
        options: { placeHolder: "Select an action" },
      });
  }
  return false;
}

/**
 * Checks whether there are unsaved files, and handles them.
 * @param unsavedUris Unsaved URIs to handle.
 * @returns Whether the user chose to abort.
 */
async function handleUnsavedFiles(unsavedUris: vscode.Uri[]) {
  const isAutoSaveEnabled =
    vscode.workspace.getConfiguration("files").get<string>("autoSave") !==
    "off";
  let possibleActions: UnsavedFilesAction[] = unsavedFilesActions;
  // If autosave is enabled, assume the user wants to save all unsaved files
  if (isAutoSaveEnabled) {
    possibleActions = possibleActions.filter(
      (act) => act.label !== "Enable Autosave"
    );
    return performUnsavedFilesAction({
      unsavedUris,
      action: getAction(possibleActions, "Save"),
      possibleActions,
    });
  }

  const multipleUnsaved = unsavedUris.length > 1;

  // Change the message based on whether there are multiple unsaved files
  let problem: string;
  if (multipleUnsaved) {
    problem = `${unsavedUris.length} files are not saved!`;
  } else {
    const relativeFilePath = vscode.workspace.asRelativePath(unsavedUris[0]);
    problem = `[${relativeFilePath}](${unsavedUris[0]}) is not saved!`;
  }

  // TODO: Add a link to some documentation?
  const message = `${problem} This may cause problems with building.`;

  return promptAndPerformUnsavedFilesAction({
    method: "message",
    level: "warning",
    message,
    possibleActions,
    unsavedUris,
  });
}

/** @return Unsaved document URIs with the specified language ids. */
function findUnsavedUris(
  languageIds: string[],
  includeUntitled: boolean = false
): vscode.Uri[] {
  return vscode.workspace.textDocuments
    .filter(
      (doc) =>
        doc.isDirty &&
        languageIds.includes(doc.languageId) &&
        (includeUntitled ? true : doc.uri.scheme !== "untitled")
    )
    .map((doc) => doc.uri);
}

/**
 * Checks for unsaved files, and if they exist, attempts to save files, prompting user if necessary.
 * @return Whether the user chose to abort the build process.
 */
async function resolveAnyUnsavedFiles(languageIds: string[]) {
  /** Unsaved document URIs likely belonging to the user's program's source code. */
  const unsavedUris = findUnsavedUris(languageIds);
  if (unsavedUris.length > 0) {
    return await handleUnsavedFiles(unsavedUris);
  }
  return false;
}

export const build = async () => {
  const shouldAbort = await resolveAnyUnsavedFiles(C_CPP_LANG_IDS);
  if (shouldAbort) {
    return;
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
