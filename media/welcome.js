// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

// KNOWN EDGE CASE: The webview will not reflect changes to settings directly from the settings UI after it has been opened.
//   This is rare and largely cosmetic, so it should be fine to leave.
(function () {
  const vscode = acquireVsCodeApi();

  const useGoogleAnalytics = document.getElementById("useGoogleAnalytics");
  const showWelcomeOnStartup = document.getElementById("showWelcomeOnStartup");

  // ensure that state is preserved when the webview is hidden and re-shown
  const previousState = vscode.getState();
  if (previousState) {
    useGoogleAnalytics.checked = previousState?.useGoogleAnalytics;
    showWelcomeOnStartup.checked = previousState?.showWelcomeOnStartup;
  }

  function saveState() {
    vscode.setState({
      useGoogleAnalytics: useGoogleAnalytics.checked,
      showWelcomeOnStartup: showWelcomeOnStartup.checked,
    });
  }

  useGoogleAnalytics.addEventListener("change", (event) => {
    vscode.postMessage({
      command: "Enable Analytics",
      value: event.target.checked,
    });
    saveState();
  });

  showWelcomeOnStartup.addEventListener("change", (event) => {
    vscode.postMessage({
      command: "Show Welcome On Startup",
      value: event.target.checked,
    });
    saveState();
  });

  saveState();
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
