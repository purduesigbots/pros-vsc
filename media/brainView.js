(function() {
    const vscode = acquireVsCodeApi();

    const brainInfo = document.getElementById("brain_info");
    const brainList = document.getElementById("brain_list");
    const programList = document.getElementById("slot_list");
    const deviceContainer = document.getElementById("device_container");

    window.addEventListener("message", event => {
        const message = event.data;
        
        switch (message.type) {
            case "deviceInfo":
                updateDeviceInfo(message.deviceInfo);
                break;
            case "deviceList":
                updateDeviceList(message.deviceList, message.currentDevice);
        }
    });

    brainList.addEventListener("change", event => {
        const selector = event.target;
        vscode.postMessage({type: "setPort", port: selector.value});
    });

    programList.addEventListener("change", event => {
        const selector = event.target;
        vscode.postMessage({type: "setSlot", slot: selector.value});
    });

    function updateDeviceInfo(deviceInfo) {
        if (deviceInfo.ssn) {
            brainInfo.innerHTML = "Brain Info:<br>";
            brainInfo.innerHTML += `Name: ${deviceInfo.name}<br>`;
            brainInfo.innerHTML += `Team: ${deviceInfo.team}<br>`;
            brainInfo.innerHTML += `VEXos Version: ${deviceInfo.vexos}<br>`;
            brainInfo.innerHTML += `CPU0 Firmware Version: ${deviceInfo.cpu0}<br>`;
            brainInfo.innerHTML += `CPU1 SDK Version: ${deviceInfo.cpu1}<br>`;
            brainInfo.innerHTML += `System ID: ${deviceInfo.ssn}`;
            programList.innerHTML = "";
            deviceInfo.programs.forEach(program => {
                programList.innerHTML += `<option value=${program.slot} ${Number(program.slot) === Number(deviceInfo.currentSlot) ? "selected" : ""}>${program.file}</option>`;
            });
            deviceContainer.innerHTML = "";
            deviceInfo.devices.forEach(device => {
                deviceContainer.innerHTML += `Port ${device.port}: ${device.type}<br>`;
            });
        } else {
            brainInfo.innerHTML = "No Brain Info Available!";
        }
    }

    function updateDeviceList(deviceList, currentDevice) {
        brainList.innerHTML = "";
        if (deviceList.length === 0) {
            programList.innerHTML = "";
            brainInfo.innerHTML = "No V5 Devices Found!";
            deviceContainer.innerHTML = "";
        }
        deviceList.forEach(deviceInfo => {
            brainList.innerHTML += `<option value=${deviceInfo.device} ${deviceInfo.device === currentDevice ? "selected" : ""}>${deviceInfo.desc}</option>`;
        });
    }

    setInterval(vscode.postMessage, 3000, {type: "updateDeviceList"});
}());