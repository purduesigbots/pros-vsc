import * as vscode from "vscode";
import * as child_process from "child_process";
import { getHomePageHtml, getHomePageStyles } from '../views/branchline-frontend/HomePage';
import { getHeaderHtml, getHeaderStyles } from '../views/branchline-frontend/Header';
import { getTemplateCardStyles } from '../views/branchline-frontend/TemplateCard';
import { getTemplateDetailHtml, getTemplateDetailStyles } from '../views/branchline-frontend/TemplateDetail';

let panel: vscode.WebviewPanel | undefined;

// Function to create and show the webview
export function showBranchlineRegistryWebview(templates: any[]) {
  if (panel) {
    panel.dispose();
  }

  panel = vscode.window.createWebviewPanel(
    "branchlineRegistry",
    "Branchline",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  const homePageHtml = getHomePageHtml(templates);
  const headerHtml = getHeaderHtml();
  const homePageStyles = getHomePageStyles();
  const headerStyles = getHeaderStyles();
  const templateCardStyles = getTemplateCardStyles();

  if (panel) {
    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PROS Branchline Registry</title>
        ${headerStyles}
        ${homePageStyles}
        ${templateCardStyles}
      </head>
      <body>
        ${headerHtml}
        ${homePageHtml}
        <script>
          const vscode = acquireVsCodeApi();

          function handleTemplateClick(templateName) {
            vscode.postMessage({ command: 'showTemplateDetail', templateName });
          }
        </script>
      </body>
      </html>
    `;

    panel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'showTemplateDetail':
          showTemplateDetailWebview(message.templateName);
          return;
      }
    });
  }
}

function showTemplateDetailWebview(templateName: string) {
  if (panel) {
    panel.dispose();
  }

  panel = vscode.window.createWebviewPanel(
    "branchlineRegistryDetail",
    `PROS Branchline Registry - ${templateName}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  // Fetch template versions and update the webview
  templateVersionsPromise.then(templatesVersions => {
    console.log("Template Versions:", templatesVersions);

    const versions = templatesVersions[templateName]?.versions || [];
    const description = templatesVersions[templateName]?.description || '';

    console.log("Versions:", versions);
    console.log("Description:", description);

    const selectedVersion = versions.length > 0 ? versions[0].version : '';

    const templateDetailHtml = getTemplateDetailHtml(templateName, versions, selectedVersion, description);
    const templateDetailStyles = getTemplateDetailStyles();

    console.log("Template Detail HTML:", templateDetailHtml);

    if (panel) {
      panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PROS Branchline Registry - ${templateName}</title>
          ${templateDetailStyles}
        </head>
        <body>
          ${templateDetailHtml}
        </body>
        </html>
      `;
    }
  }).catch(error => {
    console.error(`Failed to fetch template versions for ${templateName}: ${error.message}`);
    // Show a default message when template details are not available
    const templateDetailHtml = `<p>Template details not available for ${templateName}.</p>`;
    const templateDetailStyles = getTemplateDetailStyles();

    if (panel) {
      panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PROS Branchline Registry - ${templateName}</title>
          ${templateDetailStyles}
        </head>
        <body>
          ${templateDetailHtml}
        </body>
        </html>
      `;
    }
  });
}

function runPROSTemplateVersionsCommand(templateName: string): Promise<{ [templateName: string]: { versions: any[]; description: string } }> {
  return new Promise((resolve, reject) => {
    const command = "pros";
    const args = ["c", "get-branchline-template-versions", templateName];

    const commandString = `${command} ${args.join(' ')}`;
    child_process.exec(commandString, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
        return;
      }

      try {
        // Extract the JSON part from the output
        const jsonStartIndex = stdout.indexOf('{"versions":');
        if (jsonStartIndex === -1) {
          throw new Error("No JSON data found in command output.");
        }
        const jsonPart = stdout.substring(jsonStartIndex);
        const jsonOutput = JSON.parse(jsonPart);

        const versions = jsonOutput.versions || [];
        const description = jsonOutput.description || '';

        resolve({ [templateName]: { versions, description } });
      } catch (parseError) {
        console.error(`JSON parse error: ${parseError}`);
        // Check if parseError is an instance of Error
        if (parseError instanceof Error) {
          reject(new Error(`JSON parse error: ${parseError.message}`));
        } else {
          reject(new Error("Unknown JSON parse error"));
        }
      }
    });
  });
}

function runPROSCommand(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // Define the command and arguments
    const command = "pros";
    const args = ["c", "get-branchline-templates"];

    // Spawn the process using the command and its arguments
    const spawnedProcess = child_process.spawn(command, args, {
      shell: true,
      cwd: vscode.workspace.rootPath,
    });

    // Variable to store the JSON data
    let jsonData = "";

    // Handle standard output data
    spawnedProcess.stdout.on("data", (data) => {
      jsonData += data.toString();
    });

    // Handle standard error data
    spawnedProcess.stderr.on("data", (data) => {
      vscode.window.showErrorMessage(`Error: ${data.toString()}`);
    });

    // Handle command completion
    spawnedProcess.on("close", (code) => {
      if (code === 0) {
        // Parse the JSON data
        let templates: any[];
        try {
          templates = JSON.parse(jsonData);
          resolve(templates);
        } catch (error) {
          vscode.window.showErrorMessage("Failed to parse JSON data.");
          reject(error);
        }
      } else {
        vscode.window.showErrorMessage("Failed to fetch PROS templates.");
        reject(new Error("Failed to fetch PROS templates."));
      }
    });

    // Handle errors during spawning the process
    spawnedProcess.on("error", (err) => {
      vscode.window.showErrorMessage(`Failed to start command: ${err.message}`);
      reject(err);
    });
  });
}

export const templatesPromise = runPROSCommand();

async function fetchTemplateVersions(templates: any[]): Promise<{ [templateName: string]: { versions: any[]; description: string } }> {
  const templatesVersions: { [templateName: string]: { versions: any[]; description: string } } = {};

  for (const template of templates) {
    try {
      const versions = await runPROSTemplateVersionsCommand(template.name);
      templatesVersions[template.name] = versions[template.name];
    } catch (error) {
      console.error(`Failed to fetch versions for template ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Skip the template and continue with the next one
      continue;
    }
  }

  return templatesVersions;
}

export const templateVersionsPromise = templatesPromise.then(fetchTemplateVersions);