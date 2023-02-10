(function() {
    const vscode = acquireVsCodeApi();

    const brainInfo = document.getElementById("brain_info");
    const brainList = document.getElementById("brain_list");
    const programList = document.getElementById("programs");
    const deviceContainer = document.getElementById("device_container");
    const nameInput = document.getElementById("name");
    const teamInput = document.getElementById("team");

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

    var oldName = "";
    nameInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            vscode.postMessage({type: "setName", name: event.target.value});
        } else if (event.key === "Escape") {
            nameInput.value = oldName;
        }
    });

    var oldTeam = "";
    teamInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            vscode.postMessage({type: "setTeam", team: event.target.value});
        } else if (event.key === "Escape") {
            teamInput.value = oldTeam;
        }
    });

    function updateDeviceInfo(deviceInfo) {
        if (deviceInfo.ssn) {
            if (deviceInfo.name !== oldName) {
                nameInput.value = deviceInfo.name;
                oldName = deviceInfo.name;
            }
            if (deviceInfo.team !== oldTeam) {
                teamInput.value = deviceInfo.team;
                oldTeam = deviceInfo.team;
            }
            brainInfo.innerHTML = "Brain Info:<br>";
            brainInfo.innerHTML += `VEXos Version: ${deviceInfo.vexos}<br>`;
            brainInfo.innerHTML += `CPU0 Firmware Version: ${deviceInfo.cpu0}<br>`;
            brainInfo.innerHTML += `CPU1 SDK Version: ${deviceInfo.cpu1}<br>`;
            brainInfo.innerHTML += `System ID: ${deviceInfo.ssn}`;
            programList.innerHTML = "Programs:<br>";
            deviceInfo.programs.forEach(program => {
                //programList.innerHTML += `<option value=${program.slot} ${Number(program.slot) === Number(deviceInfo.currentSlot) ? "selected" : ""}>${program.file}</option>`;
                programList.innerHTML += `Slot ${program.slot}: ${program.file}`;
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