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

  const iconSelection = /** @type {HTMLInputElement} */ (
    document.getElementById("iconSelection")
  );
  const iconPreview = /** @type {HTMLInputElement} */ (
    document.getElementById("iconPreview")
  );

  const projectName = /** @type {HTMLInputElement} */ (
    document.getElementById("projectName")
  );
  const description = /** @type {HTMLInputElement} */ (
    document.getElementById("projectDesc")
  );

  const runafter = /** @type {HTMLInputElement} */ (
    document.getElementById("runafter")
  );
  
  slotSelection.addEventListener("change", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    vscode.postMessage({ type: "setSlot", slot: selector.value });
    });

  var prevname;
  var nametimer;
  projectName.addEventListener("keyup", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    if(prevname==selector.value) {
      return;
    }
    prevname = selector.value;

    clearTimeout(nametimer);
    nametimer = setTimeout(function() {
      vscode.postMessage({ type: "setName", projectName: selector.value });
    },!selector.value ? 3000 : 500);

  });

  var prevdesc;
  var desctimer;
  description.addEventListener("keyup", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    if(prevdesc==selector.value) {
      return;
    }
    prevdesc = selector.value;
    clearTimeout(desctimer);
    desctimer = setTimeout(function() {
      vscode.postMessage({ type: "setDesc", description: selector.value });
    },!selector.value ? 3000 : 500);
  });

  iconSelection.addEventListener("change", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    vscode.postMessage({ type: "setIcon", icon: selector.value });
    iconPreview.src = `https://raw.githubusercontent.com/purduesigbots/pros-vsc/feature/more-project-settings/media/icons/${selector.value}.png`;
  });

  runafter.addEventListener("change", (e) => {
    const selector = /** @type {HTMLInputElement} */ (e.target);
    vscode.postMessage({ type: "setAfter", runafter: selector.value });
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

    // Current Project Name
    projectName.value = json["py/state"]["project_name"] ? json["py/state"]["project_name"] : "Pros Project";
    
    // Current Project Description
    if (json["py/state"]["upload_options"]?.description) {
      description.value = json["py/state"]["upload_options"]["description"];
    } else {
      description.value = "My PROS Project";
    }

    // Current Project Slot
    if (json["py/state"]["upload_options"]?.slot) {
      slotSelection.value = json["py/state"]["upload_options"]["slot"];
    }

    // Current Project Icon
    if (json["py/state"]["upload_options"]?.icon) {
      iconSelection.value = json["py/state"]["upload_options"]["icon"];
      iconPreview.src = `https://raw.githubusercontent.com/purduesigbots/pros-vsc/feature/more-project-settings/media/icons/${json["py/state"]["upload_options"]["icon"]}.png`;
      console.log(iconSelection.value);
    } else {
      iconSelection.value = "pros";
      iconPreview.src = `https://raw.githubusercontent.com/purduesigbots/pros-vsc/feature/more-project-settings/media/icons/pros.png`;
      console.log(iconSelection.value);
    }

    // Current run-after option
    if(json["py/state"]["upload_options"]?.after) {
      runafter.value = json["py/state"]["upload_options"]["after"];
    } else {
      runafter.value = "screen";
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
