(function() {
    const vscode = acquireVsCodeApi();

    const name = document.getElementById("name");
    const team = document.getElementById("team");
    const vexos = document.getElementById("vexos");
    const cpu0 = document.getElementById("cpu0");
    const cpu1 = document.getElementById("cpu1");
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
        name.innerHTML = "Name: " + deviceInfo.name;
        team.innerHTML = "Team: " + deviceInfo.team;
        vexos.innerHTML = "VEXos Version: " + deviceInfo.vexos;
        cpu0.innerHTML = "CPU0 Firmware Version: " + deviceInfo.cpu0;
        cpu1.innerHTML = "CPU1 SDK Version: " + deviceInfo.cpu1;
        programList.innerHTML = "";
        deviceInfo.programs.forEach(program => {
            programList.innerHTML += `<option value=${program.slot} ${Number(program.slot) === Number(deviceInfo.currentSlot) ? "selected" : ""}>${program.file}</option>`;
        });
        deviceContainer.innerHTML = "";
        deviceInfo.devices.forEach(device => {
            deviceContainer.innerHTML += `<p>Device: ${device.type} | Port: ${device.port}</p>`;
        });
    }

    function updateDeviceList(deviceList, currentDevice) {
        brainList.innerHTML = "";
        deviceList.forEach(deviceInfo => {
            brainList.innerHTML += `<option value=${deviceInfo.device} ${deviceInfo.device === currentDevice ? "selected" : ""}>${deviceInfo.desc}</option>`;
        });
    }

    setInterval(vscode.postMessage, 500, {type: "updateDeviceList"});
}());