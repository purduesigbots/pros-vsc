/**
 * Javascript data bindings between the VSCode API, the project.pros file
 * contents, and the PROS Project custom editor.
 */
// @ts-check

(function () {
  // Get a reference to the VSCode webview API.
  // This is used to post messages back to the PROS extension.
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const errorContainer = document.createElement("div");
  document.body.appendChild(errorContainer);
  errorContainer.className = "error";
  errorContainer.style.display = "none";

  const slotSelection = /** @type {HTMLInputElement} */ (
    document.getElementById("slotSelection")
  );
  const projectName = /** @type {HTMLInputElement} */ (
    document.getElementById("projectName")
  );

  slotSelection.addEventListener("change", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    vscode.postMessage({ type: "setSlot", slot: selector.value });
  });

  projectName.addEventListener("change", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    vscode.postMessage({ type: "setName", projectName: selector.value });
  });

  function updateContent(/** @type {string} */ text) {
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      errorContainer.innerText = "Error: Document is not valid json";
      errorContainer.style.display = "";
      return;
    }
    console.log(json);
    errorContainer.style.display = "none";

    // Render the current settings
    projectName.value = json["py/state"]["project_name"];
    if (json["py/state"]["upload_options"]?.slot) {
      slotSelection.value = json["py/state"]["upload_options"]["slot"];
    }
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const text = message.text;

        // Update our webview's content
        updateContent(text);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text });

        return;
    }
  });

  // Webviews are normally torn down when not visible and re-created when they become visible again.
  // State lets us save information across these re-loads
  const state = vscode.getState();
  if (state) {
    updateContent(state.text);
  }
})();
