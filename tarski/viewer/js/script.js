var levels = [];

$(function () {
    makeBoard();
    loadLevelData();
});

function makeBoard() {
    $("#sentences").empty();
    for (var i = 0; i < 7; i++) {
        $("#sentences").append('<div id="sentenceBox' + i + '" class="sentenceBox"><div class="sentenceNumber"><div class="sentenceNumberText">' + (i + 1) + '</div></div><div class="sentenceTextBox"><div class="sentenceText"></div></div></div>');
    }
}

function makeDropdown() {
    $("#levelSelect").empty();
    for (var i=0; i<levels.length; i++) {
        $("#levelSelect").append('<option value="' + i + '">Level ' + levels[i].id + '</option>');
    }
    $("#levelSelect").change(function() {
        var v = $("#levelSelect").val();
        displayLevel(v);
    });
}

// Loads all the level data from a text file
function loadLevelData() {
    $.ajax({
        url: "../levels.txt"
    }).done(function (data) {
        var lvSplit = data.split("\n\n");
        levels = [];
        for (var i = 0; i < lvSplit.length; i++) {
            var lvData = lvSplit[i].split("\n");
            var level = {};
            level.id = lvData[0];
            level.shapes = [];
            var shapeData = lvData[1].split(" ");
            level.lasers = [];
            level.laserColorMap = [];
            level.ghostLimit = 0;
            // Prepare laser color map
            for (var m = 0; m < 6; m++) {
                level.laserColorMap[m] = [];
                for (var n = 0; n < 6; n++) {
                    level.laserColorMap[m][n] = "";
                }
            }
            for (var j = 0; j < shapeData.length; j++) {
                var newShapeCode = shapeData[j];
                if (newShapeCode.charAt(0) == "!") {
                    // Laser
                    var newLaser = {
                        "color": "",
                        "y": 0,
                        "z": 0
                    };
                    if (newShapeCode.indexOf('r') !== -1) {
                        newLaser.color = "red";
                    }
                    if (newShapeCode.indexOf('g') !== -1) {
                        newLaser.color = "green";
                    }
                    if (newShapeCode.indexOf('b') !== -1) {
                        newLaser.color = "blue";
                    }
                    if (newShapeCode.indexOf('o') !== -1) {
                        newLaser.color = "orange";
                    }
                    if (newShapeCode.indexOf('p') !== -1) {
                        newLaser.color = "purple";
                    }
                    if (newShapeCode.indexOf('y') !== -1) {
                        newLaser.color = "yellow";
                    }
                    newLaser.y = parseInt(newShapeCode.charAt(2));
                    newLaser.z = parseInt(newShapeCode.charAt(3));
                    level.laserColorMap[newLaser.y][newLaser.z] = newLaser.color;
                    level.lasers.push(newLaser);
                } else if (newShapeCode.charAt(0) == "?") {
                    // Ghost limit
                    level.ghostLimit = parseInt(newShapeCode.substr(1, newShapeCode.length));
                } else {
                    // Shape
                    var newShape = {
                        "type": "",
                        "color": "",
                        "size": 1,
                        "x": 0,
                        "y": 0,
                        "z": 0,
                        "laserColor": "",
                        "inWorld": true
                    };
                    if (newShapeCode.indexOf('s') !== -1) {
                        newShape.size = .5;
                    }
                    if (newShapeCode.indexOf('m') !== -1) {
                        newShape.size = 1;
                    }
                    if (newShapeCode.indexOf('l') !== -1) {
                        newShape.size = 1.5;
                    }
                    if (newShapeCode.indexOf('r') !== -1) {
                        newShape.color = "red";
                    }
                    if (newShapeCode.indexOf('g') !== -1) {
                        newShape.color = "green";
                    }
                    if (newShapeCode.indexOf('b') !== -1) {
                        newShape.color = "blue";
                    }
                    if (newShapeCode.indexOf('o') !== -1) {
                        newShape.color = "orange";
                    }
                    if (newShapeCode.indexOf('p') !== -1) {
                        newShape.color = "purple";
                    }
                    if (newShapeCode.indexOf('y') !== -1) {
                        newShape.color = "yellow";
                    }
                    if (newShapeCode.indexOf('t') !== -1) {
                        newShape.type = "tet";
                    }
                    if (newShapeCode.indexOf('c') !== -1) {
                        newShape.type = "cube";
                    }
                    if (newShapeCode.indexOf('d') !== -1) {
                        newShape.type = "dodec";
                    }
                    newShape.x = parseInt(newShapeCode.charAt(3));
                    newShape.y = parseInt(newShapeCode.charAt(4));
                    newShape.z = parseInt(newShapeCode.charAt(5));
                    newShape.laserColor = newShape.color;
                    level.shapes.push(newShape);
                }
            }
            level.sentences = [];
            for (var k = 2; k < lvData.length; k++) {
                level.sentences.push(lvData[k]);
            }
            levels.push(level);
        }
        console.log(levels);
        makeDropdown();
        displayLevel(0);
    });
}

function displayLevel(id) {
    var sentences = levels[id].sentences;
    var numSentences = sentences.length;
    for (var i = 0; i < 7; i++) {
        if (i < numSentences) {
            $("#sentenceBox" + i).css("top", (43.75 + 14 * (i - (numSentences - 1) / 2)) + "%");
            $("#sentenceBox" + i).css("opacity", 1);
            $("#sentenceBox" + i + ">>.sentenceText").text(formatSentence(sentences[i]));
        }
        else {
            $("#sentenceBox" + i).css("opacity", 0);
        }
    }
}

function formatSentence(sentence) {
    var str = sentence + "";
    str = iterReplace(str, "@", "∀");
    str = iterReplace(str, "#", "∃");
    str = iterReplace(str, "~", "¬");
    str = iterReplace(str, ">", " ⇒ ");
    str = iterReplace(str, "=", " ⇔ ");
    str = iterReplace(str, "+", " ⊕ ");
    str = iterReplace(str, "|", " ∨ ");
    str = iterReplace(str, "&", " ∧ ");
    return str;
}

function iterReplace(str, find, replace) {
    var ok = false;
    var newStr = str + "";
    while (!ok) {
        if (newStr.indexOf(find) == -1) {
            ok = true;
        } else {
            newStr = newStr.replace(find, replace);
        }
    }
    return newStr;
}