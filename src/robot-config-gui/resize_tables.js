const MAX_TABLE_WIDTH = 1200;
const MIN_TABLE_WIDTH = 650;
window.onresize = function() {
    var deviceRows = document.getElementsByClassName("device-row");
    var deviceCols = document.getElementsByClassName("device-col");
    var numDeviceCols = 6;
    var deviceTable = document.getElementById("device-table");
    var portTable = document.getElementById("ports-table");
    var portRows = document.getElementsByClassName("port-row");
    var portCols = document.getElementsByClassName("port-col");

    // Resize device and port tables such that the following rules are always met:
    // 1. The table is always as wide as the window (20px padding on each side)
    // 2. The table is never wider than MAX_TABLE_WIDTH
    // 3. The table is never narrower than MIN_TABLE_WIDTH

    var targetWidth = window.innerWidth - 40; // 10px padding on each side

    // Resize device table
    var deviceTableWidth = deviceTable.getBoundingClientRect().width;
    if(deviceTableWidth > MAX_TABLE_WIDTH){
        deviceTable.style.width = MAX_TABLE_WIDTH + "px";
    } else if(deviceTableWidth < MIN_TABLE_WIDTH){
        deviceTable.style.width = MIN_TABLE_WIDTH + "px";
    } else {
        deviceTable.style.width = targetWidth + "px";
    }
    //Resize all device table cells to be square
    var deviceTargetCellDim = deviceTable.getBoundingClientRect().width / numDeviceCols;
    var targetDeviceTableHeight = deviceTargetCellDim * deviceRows.length;
    // deviceTable.style.height = targetDeviceTableHeight + "px";
    for(var i = 0; i < deviceCols.length; i++){
        deviceCols[i].width = deviceTargetCellDim;
        deviceCols[i].height = deviceTargetCellDim;
    }

    // Resize port table
    var portTableWidth = portTable.getBoundingClientRect().width;
    if(portTableWidth > MAX_TABLE_WIDTH){
        portTable.style.width = MAX_TABLE_WIDTH + "px";
    } else if(portTableWidth < MIN_TABLE_WIDTH){
        portTable.style.width = MIN_TABLE_WIDTH + "px";
    } else {
        portTable.style.width = targetWidth + "px";
    }
    //Resize all port table cells to be square
    var portTargetCellDim = deviceTable.getBoundingClientRect().width / 7;
    var targetPortTableHeight = portTargetCellDim * portRows.length;
    // portTable.style.height = targetPortTableHeight + "px";
    for(var i = 0; i < portCols.length; i++){
        portCols[i].width = portTargetCellDim;
        portCols[i].height = portTargetCellDim;
    }
};
