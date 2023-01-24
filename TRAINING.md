# PROS VSC Training Tasks

There are many aspects to the vscode extension, but the three main ones are as follows:
- Sidebar Commands
- Installer/Filesystem
- Webviews

Each training task will introduce you to one of these aspects of the extension, increasing in difficulty as you go.

## Task 1 - Creating a New Sidebar Button
The goal of this project is to create a new button on the sidebar that will display the CLI Version to the user.
The CLI command to run to get this information is `pros --version`

You will need to modify 4 files and create 1 new file to accomplish this project
Files to modify: `package.json`, `extension.ts`, `views/tree-view.ts`, `commands/index.ts`
File to create: `commands/version.ts`

Notes: you will need to use the `extraOutput` option of BaseCommandOptions to accomplish this task.
Please feel free to use other files as reference material for accomplishing this task.
Contact me on discord if you have any questions.