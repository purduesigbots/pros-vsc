export function getWebviewContent() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Welcome</title>
  </head>
  <body>
	  <img src="https://pros.cs.purdue.edu/_static/img/pros-tux.png" width="600" class="center"/>
	  <h1 className="title">
              Open Source C/C++ Development for VEX V5 and VEX Cortex
      </h1>
	  <section className="panel">
	  <p>For help, please visit:</p>
	  <ul>
		<li>
		  <a href='https://pros.cs.purdue.edu/v5/getting-started/new-users.html'>
			This Page
		  </a>
		  for a guide to getting started with PROS for Atom.
		</li>

		<li>
		  The
		  <a href='https://pros.cs.purdue.edu/v5/tutorials/index.html'>
			PROS tutorial page
		  </a>
		  to learn about using everything from sensors to motors to tasks
		  and multithreading in PROS.
		</li>

		<li>
		  The
		  <a href='https://pros.cs.purdue.edu/v5/api/index.html'>
			PROS API documentation
		  </a>
		</li>
	  </ul>
  </body>
  </html>`;
}