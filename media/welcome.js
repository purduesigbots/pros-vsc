// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  const useGoogleAnalytics = document.getElementById("useGoogleAnalytics");
  const showWelcomeOnStartup = document.getElementById("showWelcomeOnStartup");

  useGoogleAnalytics.addEventListener("change", (event) => {
    vscode.postMessage({
      command: "useGoogleAnalytics",
      value: event.target.checked,
    });
  });

  showWelcomeOnStartup.addEventListener("change", (event) => {
    vscode.postMessage({
      command: "showWelcomeOnStartup",
      value: event.target.checked,
    });
  });

  // Handle messages sent from the extension to the webview
  // window.addEventListener("message", (event) => {
  //   const message = event.data; // The json data that the extension sent
  //   switch (message.command) {
  //     case "refactor":
  //       currentCount = Math.ceil(currentCount * 0.5);
  //       counter.textContent = `${currentCount}`;
  //       break;
  //   }
  // });
})();
