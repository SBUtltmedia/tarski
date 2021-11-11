function getShapePermutation() {
    // Get an order for the shape codes
    var rowOrder = [];
    var tries = 0;
    while (rowOrder.length < 27 && tries < 100) {
        rowOrder = getShapePermutationHelper();
        tries++;
    }
    return rowOrder;
}

function getShapePermutationHelper() {
    // Generate all possible valid blocks and shuffle the array
    var allBlocks = [];
    for (var i=0; i<216; i++) {
        var s = leftpad(i.toString(6), 3, "0");
        allBlocks.push(s);
    }
    shuffle(allBlocks);
    // Make lookup table to avoid duplicates
    var rowsUsed = [];
    var rowOrder = [];
    for (var i=0; i<27; i++) {
        var s = leftpad(i.toString(3), 3, "0");
        rowsUsed[s] = false;
    }
    // Get 9 blocks that fit
    for (var i=0; i<216; i++) {
        // Get the current block to look at
        var currentRows = extractBlock(allBlocks[i]);
        // Check if any of them exist
        var isOK = true;
        for (var j=0; j<currentRows.length; j++) {
            if (rowsUsed[currentRows[j]]) {
                isOK = false;
            }
        }
        if (isOK) {
            // Use the current rows
            for (var j=0; j<currentRows.length; j++) {
                rowsUsed[currentRows[j]] = true;
                rowOrder.push(currentRows[j]);
            }
        }
    }
    return rowOrder;
}

function extractBlock(code) {
    var perms = ["012", "021", "102", "120", "201", "210"];
    var rows = ["", "", ""];
    for (var i=0; i<3; i++) {
        for (var j=0; j<3; j++) {
            rows[j] += perms[code.charAt(i)].charAt(j);
        }
    }
    return rows;
}

// Returns true if the two arrays are disjoint, false otherwise
function isDisjoint(a1, a2) {
    for (var i=0; i<a1.length; i++) {
        for (var j=0; j<a2.length; j++) {
            if (a1[i] == a2[j]) {
                return false;
            }
        }
    }
    return true;
}