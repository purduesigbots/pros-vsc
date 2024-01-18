const MAX_TABLE_WIDTH = 1200;
const MIN_TABLE_WIDTH = 650;
window.onresize = window.onload = function() {
    var deviceRows = document.getElementsByClassName("device-row");
    var deviceCols = document.getElementsByClassName("device-col");
    var numDeviceCols = 6;
    var deviceTable = document.getElementById("device-table");
    var portTable = document.getElementById("ports-table");
    var portRows = document.getElementsByClassName("port-row");
    var portCols = document.getElementsByClassName("port-col");
    var numPortCols = 7;

    //Resize all rows such that their height is the same as the first column's width
    for (var i = 0; i < deviceRows.length; i++) {
        deviceRows[i].style.height = deviceCols[0].offsetWidth + "px";
    }
    for (var i = 0; i < portRows.length; i++) {
        portRows[i].style.height = portCols[0].offsetWidth + "px";
    }
};
