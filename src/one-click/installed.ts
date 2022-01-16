import * as child_process from "child_process";
import { promisify } from "util";
var fetch = require('node-fetch');

export async function getCliVersion(url: string) {
    // Fetch the url
    const response = await fetch(url);
    if (!response.ok) {
        console.log(response.url, response.status, response.statusText);
        throw new Error(`Can't fetch release: ${response.statusText}`);
    }
    // Get the version number from the returned json
    var vString = (await response.json()).tag_name;
    return vString;
}

export async function getInstallPromptTitle(oneClickPath: string) {
    var title = "You do not have the PROS CLI installed. Install it now? (Recommended).";
    const recent = await getCliVersion('https://api.github.com/repos/purduesigbots/pros-cli/releases/latest');
    const split = "version ";
    try {
        const { stdout, stderr } = await promisify(child_process.exec)(
            `${oneClickPath} --version`
        );

        if (!stdout.includes(recent)) {
            console.log(stdout);
            console.log(recent);
            title = "There is an update available! Would you like to update now?";
        } else {
            title = "PROS is up to date!";
        }
    } catch (e) {
        try {
            const { stdout, stderr } = await promisify(child_process.exec)(
                `pros --version`
            );
            if (!stdout.includes(recent)) {
                title = "An outdated version of PROS was detected on your system, not installed through VS Code. Would you like to install the update with VS Code?"
            } else {
                title = "PROS detected but not installed with VSCode. Would you like to install using VSCode? (Recommended).";
            }
        } catch (er) {
            console.log(er);
        }
    }
    return title;
}