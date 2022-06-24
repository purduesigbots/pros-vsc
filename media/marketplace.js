/**
 * Javascript data bindings between the VSCode API, the project.pros file
 * contents, and the PROS Template Marketplace.
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
    const searchBar = /** @type {HTMLInputElement} */ (
        document.getElementById("searchBar")
    );

    var templatetimer;
    var prevsearch;
    searchBar.addEventListener("keydown", (e) => {
        const selector = /** @type {HTMLInputElement} */ (e.target);
        // run a search algorithm to find the best match
        // @ts-ignore
        if(selector.value == prevsearch) {
            return;
        }
        prevsearch = selector.value;
        clearTimeout(templatetimer);
        templatetimer = setTimeout(function () {
            vscode.postMessage({ type: "search", searchstring: selector.value });
        }, !selector.value ? 3000 : 500);
    }
    );

    function updateContent(/** @type {string} */ text) {
        const content = /** @type {HTMLDivElement} */ (document.getElementById("content"));
        content.innerHTML = text;
    }
    function updateError(/** @type {string} */ text) {
        const error = /** @type {HTMLDivElement} */ (document.getElementById("error"));
        error.innerHTML = text;
    }
    


});  