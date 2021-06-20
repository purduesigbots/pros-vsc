import * as vscode from "vscode";

export function getWebviewContent(styleUri: vscode.Uri) {
	return `
	<!DOCTYPE html>
	<html lang="en">
	   <head>
		  <link href="${styleUri}" rel="stylesheet" />
		  <title>Welcome</title>
	   </head>
	   <body>
		  <div class="container">
			 <header>
			 <a class="header__link" title="Learn more about PROS" href="https://pros.cs.purdue.edu/">
				 <div class="header__logo">
					 <img class="image__logo" src="https://pros.cs.purdue.edu/_static/img/pros-tux.png" />
				 </div>
			 </a>
			 <p class="header__blurb">
			 	 <a class="bold" title="Open PROS on GitHub" href="https://github.com/purduesigbots/pros">Open Source</a>
				 C/C++ Development for <b>VEX V5</b> and <b>VEX Cortex</b>. PROS is a lightweight and 
				 fast alternative open source operating system for VEX EDR Microcontrollers. It features multitasking, 
				 low-level control, and Wiring compatible functions to harness the full power of the Cortex. 
				 PROS is built with developers in mind and with a focus on providing an environment for 
				 industry-applicable experience.
			 </p>
		     </header>
		  </div>
	   </body>
	</html>
	`;
}