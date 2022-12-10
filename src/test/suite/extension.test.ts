import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { cleanup, install } from "../../one-click/install";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test("One-Click Installation", async () => {
    const ext = vscode.extensions.getExtension("sigbots.pros");
    if (ext) {
      const myExtensionContext = await ext.activate();
      install(myExtensionContext);
      assert.ok(cleanup(myExtensionContext));
    }
  });
});
