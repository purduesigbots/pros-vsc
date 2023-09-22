window.onresize = function(){
    var deviceRows = document.getElementsByClassName("device-row");
    var deviceCols = document.getElementsByClassName("device-col");
    var deviceTable = document.getElementById("device-table");
    var portTable = document.getElementById("ports-table");
    var portRows = document.getElementsByClassName("port-row");
    var portCols = document.getElementsByClassName("port-col");
    // var fieldTable = document.getElementById("port-table");
    const maxTableWidth = 2000;
    const minTableWidth = 650;
    // Set the height of the device table rows to make it so that the table entries are 
    // square. There are six columns in the devices table.
    for(var i = 0, row; row = deviceRows[i]; i++){
        var cellDim = (window.innerWidth - 60) / 6.0;
        if(window.innerWidth > maxTableWidth){
            deviceTable.width = maxTableWidth;
        } else if(portTable.clientWidth > minTableWidth){
            deviceTable.width = window.innerWidth - 60;
            row.height = cellDim;
            for(var j = 0, col; col = deviceCols[i*j+j]; j++){
                col.width = cellDim;
                col.height = cellDim;
            }
        } else {
            console.log("else");
            deviceTable.width = minTableWidth - 30;
            var minCellWidth = (minTableWidth - 30) / 6.0;
            for(var j = 0, col; col = deviceCols[i*j+j]; j++){
                col.width = minCellWidth;
                col.height = minCellWidth;
            }
        }
    }

    for(var i = 0, row; row = portRows[i]; i++){
        var cellDim = (window.innerWidth - 60) / 7.0;
        if(window.innerWidth > maxTableWidth){
            portTable.width = maxTableWidth;
        } else if(portTable.clientWidth > minTableWidth){
            portTable.width = window.innerWidth - 60;
            row.height = cellDim;
            for(var j = 0, col; col = portCols[i*j+j]; j++){
                col.width = cellDim;
                col.height = cellDim;
            }
        } else {
            console.log("else");
            portTable.width = minTableWidth - 30;
            var minCellWidth = (minTableWidth - 30) / 7.0;
            for(var j = 0, col; col = portCols[i*j+j]; j++){
                col.width = minCellWidth;
                col.height = minCellWidth;
            }
        }
    }
};
