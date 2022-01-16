import * as vscode from "vscode";
import * as child_process from "child_process";
import { promisify } from "util";
import { gt } from "semver";
import axios from "axios";

import { PREFIX } from "../commands/cli-parsing";
import { getNonce } from "./nonce";
import { install } from "../one-click/install";

var fetch = require('node-fetch');
/**
 * Queries the server for the latest available library version.
 *
 * @returns The kernel library versions
 */
export const fetchKernelVersion = async (): Promise<string> => {
	try {
	const { stdout, stderr } = await promisify(child_process.exec)(
		`pros c q --target v5 --machine-output`
	);

	let newKernel = "0.0.0";

	for (let e of stdout.split(/\r?\n/)) {
		if (e.startsWith(PREFIX)) {
			let jdata = JSON.parse(e.substr(PREFIX.length));
			if (jdata.type === "finalize") {
				for (let ver of jdata.data) {
					if (ver.name === "kernel" && gt(ver.version, newKernel)) {
						newKernel = ver.version;
					}
				}
			}
		}
	}

	return newKernel;
} catch(error) {
	return "0.0.0";
}
};


export const fetchKernelVersionNonCLIDependent = async (): Promise<string> => {
    const response = await fetch("https://api.github.com/repos/purduesigbots/pros/releases/latest");
    if (!response.ok) {
      console.log(response.url, response.status, response.statusText);
      throw new Error(`Can't fetch kernel release: ${response.statusText}`);
    }
    var v = (await response.json()).tag_name;
    return v;
};
export const fetchCliVersion = async (): Promise<string> => {
	const response = await axios.get(
		"https://purduesigbots.github.io/pros-mainline/stable/UpgradeManifestV1.json"
	);
	return `${response.data.version.major}.${response.data.version.minor}.${response.data.version.patch}`;
};

export function getWebviewContent(
	styleUri: vscode.Uri,
	scriptUri: vscode.Uri,
	imgHeaderPath: vscode.Uri,
	imgIconPath: vscode.Uri,
	imgActionPath: vscode.Uri,
	imgProjectProsPath: vscode.Uri,
	newKernel: string,
	newCli: string,
	useGoogleAnalytics: boolean,
	showWelcomeOnStartup: boolean,
	context: vscode.ExtensionContext
) {
	const nonce = getNonce();
	// install(context);

	return `
	<!DOCTYPE html>
	<html lang="en">
	   <head>
		  <link href="${styleUri}" rel="stylesheet" />
		  <title>Welcome</title>
	   </head>
	   <body>
			 <header>
			 <a class="header__link" title="Learn more about PROS" href="https://pros.cs.purdue.edu/">
				 <div class="header__logo">
					 <img class="image__logo" src="${imgHeaderPath}" />
				 </div>
			 </a>
			 <p class="header__blurb">
			 	 <a title="Open PROS on GitHub" href="https://github.com/purduesigbots/pros">Open Source</a>
				 C/C++ Development for <b>VEX V5</b> and <b>VEX Cortex</b>. PROS is a lightweight and 
				 fast alternative open source operating system for VEX EDR Microcontrollers. It features multitasking, 
				 low-level control, and Wiring compatible functions to harness the full power of the Cortex. 
				 PROS is built with developers in mind and with a focus on providing an environment for 
				 industry-applicable experience.
			 </p>
		     </header>
				<div class="body__container">
					<div class="body__content">
						<div class="body__intro">
							Welcome To <span class="bold">PROS</span>
						</div>
						<div class="body__new_versions">
							See what's new in <a href="https://pros.cs.purdue.edu/v5/releases/cli${newCli}.html">CLI ${newCli}</a> and <a href="https://pros.cs.purdue.edu/v5/releases/kernel${newKernel}.html">Kernel ${newKernel}</a>
						</div>
						<div class="body__blurb">
							Primary maintenance of PROS is done by students at Purdue University through Purdue ACM SIGBots. Inspiration for this project came from several computer science and engineering students itching to write code for VEX U's extended autonomous period. We created PROS to leverage this opportunity. 	
						</div>
						<hr>
						<div class="body__features">
							<div class="body__features_header">Features</div>
							<div class="body__features_img_left_one">Access all of the PROS commands you will need from the VSCode sidebar. Click on the PROS Icon on the sidebar for a list of common actions like Building, Uploading, Debugging, and Upgrading your project.</div>
							<div class="body__features_img_right_one"><img src="${imgIconPath}" /></div>
							<div class="body__features_img_left_two"><img src="${imgActionPath}" /></div>
							<div class="body__features_img_right_two">Quickly iterate with the PROS Quick Action button. This PROS Icon on the top right of the editor will build and upload your code.</div>
							<div class="body__features_img_left_three">Modify your project's settings easily with the project.pros custom editor. Opening the "project.pros" file at the root of your project will open this custom settings editor.</div>
							<div class="body__features_img_right_three"><img src="${imgProjectProsPath}" /></div>
						</div>
						<hr>
						<div class="body__settings">
							<div class="body__settings_header">Settings</div>
							<div class="body__settings_checkbox">
								<div><input type="checkbox" ${useGoogleAnalytics ? "checked" : ""
		} id="useGoogleAnalytics"/></div>
								<div><label>Send anonymous usage statistics</label></div>
							</div>
							<div class="body__settings_checkbox">
								<div><input type="checkbox" ${showWelcomeOnStartup ? "checked" : ""
		} id="showWelcomeOnStartup" /></div>
								<div><label>Show Welcome Guide when opening VSCode</label></div>
							</div>
						</div>
						<hr>
						<div class="body__help">
							For help, please visit:
							<ul>
								<li><a href="https://pros.cs.purdue.edu/v5/editor/index.html">This page</a> for a guide to getting started with PROS for VSCode</li>
								<li>The <a href="https://pros.cs.purdue.edu/v5/tutorials/index.html">PROS tutorial page</a>to learn about using everything from sensors to motors to tasks and multithreading in PROS.</li>
								<li>The <a  href="https://pros.cs.purdue.edu/v5/api/index.html">PROS API documentation</a></li>
							</ul>
						</div>
					</div>
				</div>
		  </div>

			<script nonce="${nonce}" src="${scriptUri}"></script>
	   </body>
	</html>
	`;
}
