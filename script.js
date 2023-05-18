var TEST_MODE = false;
var UNLOCK_ALL = false;
var ENABLE_LASER_GRID = false;

var GRID_SIZE = 6;

var currentChapter = -1;
var currentLevel = -1;

var inVR = false;

$(function () {
    var scene = document.querySelector('a-scene');
    scene.addEventListener("enter-vr", function () {
        inVR = true;
        $(".vive-controls").attr("visible", "true");
        $("#camera").attr("position", "0 0 0");
    });
    scene.addEventListener("exit-vr", function () {
        inVR = false;
        $(".vive-controls").attr("visible", "false");
        $("#camera").attr("position", "0 1.6 0");
    });

    // Retrieve save file
    var temp = localStorage.getItem("tarskiSaveFile");
    if (temp !== null) {
        userData = JSON.parse(temp);
        if (userData.infiniteBestScore == undefined) {
            userData.infiniteBestScore = 0;
        }
    }
    makeFloor(GRID_SIZE, GRID_SIZE);
    makeCompass();
    createPanels();
    createInfinitePanels();
    createProgressLights();
    hideProgressLights();
    makeInfOrder();
    if (ENABLE_LASER_GRID) {
        makeLaserWall();
    }
    makeLevelSelectLevers();
    loadLevels();
    if (TEST_MODE) {
        playGameIntro();
        hideTitleText();
        setTimeout(function () {
            hideLevelSelect();
                        startLevel(1);
                        setTimeout(function() {
                            showLevelCompleteScreen();
                        }, 3000);

            raiseMachineArms();
            startInfiniteMode();
            setTimeout(function () {
               showInfiniteEndScreen(true);
            }, 1000);
        }, 1500);

    }
    tick();
});

var inMenu = false;

var levels = [];

var shapes = [];

var lasers = [];
var laserColorMap = [];

var ghostLimit = 0;
var ghostShapes = 0;

var sentences = [];

var tutorial = [];

var helptext = [];

var totalMoves = 0;
var totalTime = 0;

var startTime = 0;
var endTime = 0;

var levelAlreadyCleared = false;

// Infinite mode specific stuff
var infiniteMode = false;
var infiniteLevel = 0;
var sentenceBank = [];
var infiniteMovesLeft = 0;
var allShapes = [];
var infRuleOrder = [];

var colors = {
    "red": "#ff6666",
    "green": "#00e6ac",
    "blue": "#33adff",
    "orange": "#ff9900",
    "purple": "#6600cc",
    "yellow": "#ffff66"
}

var userData = {
    "bestScores": [
        {
            "cleared": false,
            "time": 0,
            "moves": 0
        },
        {
            "cleared": false,
            "time": 0,
            "moves": 0
        },
        {
            "cleared": false,
            "time": 0,
            "moves": 0
        },
        {
            "cleared": false,
            "time": 0,
            "moves": 0
        },
        {
            "cleared": false,
            "time": 0,
            "moves": 0
        },
        {
            "cleared": false,
            "time": 0,
            "moves": 0
        }
    ],
    "infiniteBestScore": 0
};

// Called every frame
function tick() {
    if (inMenu) {
        var cameraPos = document.querySelector('#camera').getAttribute("position");
        for (var i = 1; i <= 6; i++) {
            var ball = document.querySelector('#selectLeverBall' + i);
            var ballMesh = ball.getObject3D('mesh');
            var ballPos = new THREE.Vector3();
            ballPos.setFromMatrixPosition(ballMesh.matrixWorld);
            var theta = Math.atan2(ballPos.x - cameraPos.x, ballPos.z - cameraPos.z);
            var normTheta = theta / (2 * Math.PI) * 360;
            if (i <= 3) {
                $("#selectLeverBox" + i).attr("rotation", "0 " + ((normTheta + 90) % 360) + " 0");
            } else {
                $("#selectLeverBox" + i).attr("rotation", "0 " + ((normTheta + 270) % 360) + " 0");
            }
        }
    }
    updateWatch();
    requestAnimationFrame(tick);
}

// Make the floor tiles (called once only)
function makeFloor(width, depth) {
    $("#floor").empty();
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < depth; j++) {
            $("#floor").append('<a-box id="floorTile' + i + '-' + j + '" mixin="floorTile"></a-box>');
            var tile = getFloorTile(i, j);
            tile.attr("position", (.2 * i) + " .05 " + (.2 * j));
            if ((i + j) % 2 == 0) {
                tile.attr("color", "#808080");
            } else {
                tile.attr("color", "#606060");
            }
        }
    }
    $("#cornerMarkers").empty();
    for (var i = 0; i < 4; i++) {
        $("#cornerMarkers").append('<a-entity id="cornerMarker' + i + '" position="' + (i % 2 == 0 ? -.5 : .5) + ' 0 ' + (i < 2 ? -.5 : .5) + '"><a-box scale=".0125 .0125 .20625" position="-.1 .6 0" color="#ffb84d"></a-box><a-box scale=".0125 .0125 .20625" position=".1 .6 0" color="#ffb84d"></a-box><a-box scale=".20625 .0125 .0125" position="0 .6 -.1" color="#ffb84d"></a-box><a-box scale=".20625 .0125 .0125" position="0 .6 .1" color="#ffb84d"></a-box><a-entity mixin="futura" scale="1 1 1" position="0 .601 0" rotation="270 0 0" text="value: CORNER; color: #ffb84d; align: center"></a-entity></a-entity>');
    }
}

function getFloorTile(i, j) {
    return $("#floorTile" + i + "-" + j);
}

function makeCompass() {
    var directions = ["N", "W", "S", "E"];
    for (var i = 0; i < 4; i++) {
        $("#compass").append('<a-entity rotation="0 ' + (90 * i) + ' 0" position="0 0 0"><a-box color="#000000" scale=".25 .025 .25" position="0 .6 -.8" rotation="0 45 0"></a-box><a-entity text="value: ' + directions[i] + ';" mixin="futura" position="0 .61 -.8" rotation="270 0 0" scale="4 4 4"></a-entity></a-entity>');
    }
}

// Make entities for all of the shapes for the current level
function loadShapes() {
    $("#shapes").empty();
    var toInsert = "";
    for (var i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        // Set type
        if (shape.type == "cube") {
            var size = .1 * shape.size;
            toInsert += '<a-box id="shape' + i + '" class="shape"  clickable scale="' + size + ' ' + size + ' ' + size + '"></a-box>';
        } else if (shape.type == "dodec") {
            var radius = .065 * shape.size;
            toInsert += '<a-dodecahedron id="shape' + i + '"  clickable class="shape" radius="' + radius + '"></a-dodecahedron>';
        } else if (shape.type == "tet") {
            var radius = .075 * shape.size;
            toInsert += '<a-tetrahedron id="shape' + i + '"  clickable  class="shape" radius="' + radius + '"></a-tetrahedron>';
        }
        // Set position
        prepareShapeEnter(i);
        // Set color
        $("#shape" + i).attr("color", colors[shape.color]);

    }
    $("#shapes").append(toInsert);
    updateHandControls();
}

// Set a timeout for the shape entering
function prepareShapeEnter(i) {
    setTimeout(function () {
        shapeEnter(i);
    }, 100 * i);
}

// Animate a shape entering the play area, fired out of the machine
function shapeEnter(i) {
    // Animate moving the shape
    var shape = shapes[i];
    var pos = getCoordsFromGrid(shape.x, shape.y, shape.z);
    var start = {
        "x": 0,
        "y": 0,
        "z": 0
    };
    var mid = {
        "x": 0,
        "y": 0,
        "z": 0
    };
    if (i % 3 == 0) {
        start = {
            "x": -1.15,
            "y": 3.4,
            "z": -1.7
        };
        mid = {
            "x": -1.5,
            "y": 4.75,
            "z": -1
        };
    } else if (i % 3 == 1) {
        start = {
            "x": 0,
            "y": 3.4,
            "z": -1.7
        };
        mid = {
            "x": 0,
            "y": 5,
            "z": -1
        };
    } else if (i % 3 == 2) {
        start = {
            "x": 1.15,
            "y": 3.4,
            "z": -1.7
        };
        mid = {
            "x": 1.5,
            "y": 4.75,
            "z": -1
        };
    }
    $("#shape" + i).attr("position", start.x + " " + start.y + " " + start.z);
    $(start).animate(mid, {
        duration: 200,
        easing: "easeOutQuad",
        step: function () {
            $("#shape" + i).attr("position", this.x + " " + this.y + " " + this.z);
        }
    }).animate({
        "x": pos.x,
        "y": pos.y,
        "z": pos.z
    }, {
        duration: 400,
        easing: "easeInQuad",
        step: function () {
            $("#shape" + i).attr("position", this.x + " " + this.y + " " + this.z);
        }
    });
    setTimeout(function () {
        $("#shape" + i).attr("position", pos.x + " " + pos.y + " " + pos.z);
    }, 700);
    // Animate the dispenser horns
    $({
        h: 1.2
    }).animate({
        h: 1
    }, {
        duration: 100,
        easing: "easeInQuad",
        step: function () {
            $("#horn" + (i % 3)).attr("scale", "1 " + this.h + " 1");
        }
    });
}

function disableHandControls() {
 //   $(".hand").attr("aabb-collider", "objects: .lever, .infChoiceBox");
}

function updateHandControls() {
setTimeout(()=>{
 $(".hands").each(function (){
this.removeAttribute("aabb-collider");
this.setAttribute("aabb-collider", "objects: .shape, .lever, .infChoiceBox"); 
// $(".hands").attr("aabb-collider", "objects: .shape, .lever, .infChoiceBox");
   // $(".hands").attr("grab", "true");
})
},5000);
}

function getCoordsFromGrid(x1, y1, z1) {
    return {
        x: .2 * x1 - .5,
        y: .2 * y1 + .7,
        z: .2 * z1 - .5
    };
}

function getGridFromCoords(x1, y1, z1) {
    var pos = {
        x: 5 * (x1 + .5),
        y: 5 * (y1 - .7),
        z: 5 * (z1 + .5)
    }
    pos.x = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(pos.x)));
    pos.y = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(pos.y)));
    pos.z = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(pos.z)));
    return pos;
}

function animatePos(el, from, to, dur) {
    $(from).animate(to, {
        duration: dur,
        step: function () {
            el.setAttribute("position", this);
        }
    });
    setTimeout(function () {
        el.setAttribute("position", to);
    }, dur);
}

// Creates the sentence panels (only run once)
function createPanels() {
    $("#board").empty();
    var toInsert = "";
    for (var i = 0; i < 7; i++) {
        toInsert += '<a-entity class="boardPanel" id="boardPanel' + i + '" position="0 ' + (2.5 - .25 * i) + ' -1" visible="false">';
        toInsert += '<a-box id="numberPanel' + i + '" position="-1.15 0 0" scale=".2 .2 .025" color="#000000"></a-box>';
        toInsert += '<a-entity id="numberText' + i + '" mixin="futura" scale="4 4 4" position="-1.14 .04 0.01275" text="value: ' + (i + 1) + ';"></a-entity>';
        toInsert += '<a-box id="statementPanel' + i + '" scale="2 .2 .025" color="#ffffff"></a-box>';
        toInsert += '<a-entity id="statementText' + i + '" mixin="paneltext" scale="1.5 1.5 1.5" position="0 0.01 .01275" text="value: "></a-entity>';
        toInsert += '<a-box id="truthPanel' + i + '" position="1.15 0 0" scale=".2 .2 .025" color="#ff4d4d"></a-box>';
        toInsert += '<a-entity id="truthText' + i + '" mixin="futura" scale="4 4 4" position="1.15 .04 .01275" text="value: F; color: #ffffff;"></a-entity>';
        toInsert += '</a-entity>';
    }
    $("#board").append(toInsert);
}

// Make the sentence bank panels for infinite mode
function createInfinitePanels() {
    $("#subSentencesLeft").empty();
    $("#subSentencesRight").empty();
    var toInsert = ["", ""];
    for (var i = 0; i < 4; i++) {
        var index = (i <= 1 ? 0 : 1);
        toInsert[index] += '<a-entity class="boardPanelInf" id="boardPanelInf' + i + '" position="' + (index == 0 ? -.2 : .2) + ' ' + (i % 2 == 0 ? .15 : -.15) + ' .16" visible="true">';
        toInsert[index] += '<a-box id="statementPanelInf' + i + '" class="statementPanelInf" scale="2 .2 .025" color="#b0b0b0"></a-box>';
        toInsert[index] += '<a-entity id="statementTextInf' + i + '" mixin="paneltext" scale="1.5 1.5 1.5" position="0 0 .01275" text="value: "></a-entity>';
        toInsert[index] += '</a-entity>';
    }
    $("#subSentencesLeft").append(toInsert[0]);
    $("#subSentencesRight").append(toInsert[1]);
    updateHandControls();
}

// Updates the sentence panels to reflect the current sentences
function updatePanels() {
    for (var i = 0; i < 7; i++) {
        // Hide excess panels
        if (i < sentences.length) {
            $("#boardPanel" + i).attr("visible", "true");
            $("#boardPanel" + i).attr("position", "0 " + (1.5 + .125 * (sentences.length - 1) - .25 * i) + " -1");
            $("#statementText" + i).attr("text", "value: " + formatSentence(sentences[i]));
        } else {
            $("#boardPanel" + i).attr("visible", "false");
        }
    }
}

function createProgressLights() {
    $("#progressLights").empty();
    var toAppend = "";
    for (var i = 1; i <= 7; i++) {
        toAppend += '<a-entity id="light' + i + '" class="light" position="' + (.2 * (i - 4)) + ' -.365 0"><a-cylinder id="lightHex' + i + '" class="lightHex" color="#00b359" segments-radial="6" rotation="0 90 90" scale=".075 .052 .075" position="0 0 0"></a-cylinder><a-entity id="lightText' + i + '" scale="1.5 1.5 1.5" class="lightText" mixin="futura" position="0 0.005 .027" text="value: ; color: #ffffff;"></a-entity></a-entity>';
    }
    $("#progressLights").append(toAppend);
}

function hideProgressLights() {
    $("#progressLights").attr("visible", "false");
    $("#progressLine").attr("visible", "false");
}

function showProgressLights() {
    $("#progressLights").attr("visible", "true");
    $("#progressLine").attr("visible", "true");
}

function setupProgressLights(level) {
    $(".lightHex").attr("color", "#404040");
    for (var i = 1; i <= 7; i++) {
        $("#lightText" + i).attr("text", "value: " + level + "-" + i + ";");
    }
}

function setLight(id, state) {
    var color = "#444444";
    if (state == "active") {
        color = "#ffff4d";
    } else if (state == "complete") {
        color = "#00b359";
    }
    $("#lightHex" + id).attr("color", color);
}

// Loads all the level data from a text file
function loadLevels() {
    $.ajax({
        url: "levels.txt"
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
        loadTutorial();
    });
}

function loadLevel(index) {
    sentences = JSON.parse(JSON.stringify(levels[index].sentences));
    shapes = JSON.parse(JSON.stringify(levels[index].shapes));
    lasers = JSON.parse(JSON.stringify(levels[index].lasers));
    laserColorMap = JSON.parse(JSON.stringify(levels[index].laserColorMap));
    ghostLimit = levels[index].ghostLimit;
    ghostShapes = 0;
    $("#ghostCountNumber").attr("text", "value: " + ghostShapes + "; align: right;");
    $("#ghostLimitNumber").attr("text", "value: /" + ghostLimit + "; align: left;");
    $("#levelCodeDisplay").attr("text", "value: " + levels[index].id + ";");
    checkCenterCorner();
    loadShapes();
    updatePanels();
    makeLasers();
    if (lasers.length > 0 && ENABLE_LASER_GRID) {
        $("#laserWall").attr("visible", "true");
    } else {
        $("#laserWall").attr("visible", "false");
    }
    if (ghostLimit > 0) {
        $("#ghostCounter").attr("visible", "true");
    } else {
        $("#ghostCounter").attr("visible", "false");
    }
    loadHelpTextFromCode(levels[index].id);
    evaluateWorld();
    startTime = (new Date()).getTime();
    levelAlreadyCleared = false;
}

function loadHelpTextFromCode(code) {
    var index = -1;
    for (var i = 0; i < tutorial.length; i++) {
        if (tutorial[i].id == code) {
            index = i;
        }
    }
    if (index > -1) {
        makeHelpText(index);
    } else {
        makeHelpText(-1);
    }
}

function loadLevelFromCode(code) {
    var index = -1;
    for (var i = 0; i < levels.length; i++) {
        if (levels[i].id == code) {
            index = i;
        }
    }
    if (index > -1) {
        loadLevel(index);
    } else {

    }
}

function loadTutorial() {
    $.ajax({
        url: "tutorial.txt"
    }).done(function (data) {
        var lvSplit = data.split("\n\n");
        tutorial = [];
        for (var i = 0; i < lvSplit.length; i++) {
            var lvData = lvSplit[i].split("\n");
            var level = {};
            level.id = lvData[0];
            level.lines = [];
            for (var j = 1; j < lvData.length; j++) {
                var line = {};
                var lineData = lvData[j].split("; ");
                // Box size/position data
                var posData = lineData[0].split(" ");
                line.w = parseFloat(posData[0]);
                line.h = parseFloat(posData[1]);
                line.x = parseFloat(posData[2]);
                line.y = parseFloat(posData[3]);
                line.lines = parseFloat(posData[4]);
                if (lineData.length == 2) {
                    // No arrow
                    line.text = lineData[1];
                    line.arrow = null;
                } else {
                    // Arrow
                    arrowData = lineData[1].split(" ");
                    line.text = lineData[2];
                    line.arrow = {
                        "side": arrowData[0],
                        "pos": arrowData[1]
                    };
                }
                level.lines.push(line);
            }
            tutorial.push(level);
        }
        if (TEST_MODE) {
            //loadLevel(levels.length - 1);
            //loadLevelFromCode("5-7");
        }
    });
}

function makeHelpText(index) {
    $("#tutorial").empty();
    if (index > -1) {
        helptext = tutorial[index].lines;
        for (var i = 0; i < helptext.length; i++) {
            var help = helptext[i];
            // Make box
            $("#tutorial").append('<a-box scale="' + help.w + ' ' + help.h + ' .01" position="' + help.x + ' ' + help.y + ' 0" color="#202020"></a-box>');
            // Make text
            $("#tutorial").append('<a-entity mixin="helptext" scale="1.5 1.5 1.5" position="' + (help.x) + ' ' + (help.y + .005) + ' .01" text="value: ' + help.text + '; color: #ffffff; align: center"></a-entity>');
            // Make arrow
            var x = 0;
            var y = 0;
            if (help.arrow != null) {
                if (help.arrow.side == "bottom") {
                    x = help.x + (help.arrow.pos - .5) * help.w;
                    y = help.y - .5 * help.h;
                } else if (help.arrow.side == "top") {
                    x = help.x + (help.arrow.pos - .5) * help.w;
                    y = help.y + .5 * help.h;
                }
                $("#tutorial").append('<a-box scale=".1 .1 .01" position="' + x + ' ' + y + ' 0" color="#202020" rotation="0 0 45"></a-box>');
            }
        }
    }
}

function playGameIntro() {
    // Exit lever
    $({
        r: 0
    }).animate({
        r: 1
    }, {
        duration: 1000,
        step: function () {
            $("#startLever").attr("rotation", (-90 * this.r) + " 0 0");
            $("#machine").attr("position", "0 " + (100 * (1 - this.r)) + " 0");
        },
        easing: "easeOutQuad"
    });
    setTimeout(function () {
        $("#startLever").attr("scale", "0 0 0");
        $("#machine").attr("position", "0 0 0");
        showLevelSelect();
    }, 1025);
}

// Make the levers on the lever select screen
function makeLevelSelectLevers() {
    $("#levelSelect").empty();
    for (var i = 1; i <= 6; i++) {
        makeLever(i);
    }
}

// Create and bind events to a lever on the level select screen
function makeLever(id) {
    // Make lever parts
    $("#levelSelect").append('<a-entity id="selectLever' + id + '" rotation="0 90 0" position="0 0 0"></a-entity>');
    $("#selectLever" + id).append('<a-box id="leverBox' + id + '" color="#444" scale=".2 1.5 .2" position="0 .75 -1.2"></a-box>');
    $("#selectLever" + id).append('<a-box id="leverCrevice' + id + '" color="#222" scale=".1 .5 .1" position="0 1.2 -1.145"></a-box>');
    $("#selectLever" + id).append('<a-entity id="lever' + id + '" position="0 0 0"></a-entity>');
    $("#lever" + id).append('<a-cylinder color="#666" scale=".025 .4 .025" position="0 1.4 -1" rotation="90 0 0"></a-cylinder>');
    $("#lever" + id).append('<a-sphere id="handle' + id + '"  mixin="cube" class="lever" color="#666" scale=".05 .05 .05" position="0 1.4 -.8" rotation="90 0 0"></a-sphere>');
    $("#selectLever" + id).append('<a-entity mixin="futura" scale="1.10 1.10 1.10" position="0 0.85 -1.09" text="value: ' + (id == 6 ? "LEVEL" : "LEVEL") + '; color: #808080;"></a-entity>');
    $("#selectLever" + id).append('<a-entity mixin="futura" scale="5 5 5" position="0 .6 -1.09" text="value: ' + (id == 6 ? "S" : id) + '; color: #c0c0c0;"></a-entity>');
    $("#selectLever" + id).append('<a-sphere id="selectLeverBall' + id + '" color="#000000" position="0 1.65 -1.2" radius=".1" segments-height="8" segments-width="8" opacity=".5"></a-sphere>');
    $("#selectLever" + id).append('<a-entity id="selectLeverBox' + id + '" position="0 1.65 -1.2" rotation="0 0 0"></a-entity>');
    $("#selectLeverBox" + id).append('<a-entity id="leverScore' + id + '" class="leverScore" mixin="futura" scale="1 1 1" position="0 0 .1 text="value: NEW!; color: #ffffff;"></a-entity>');
    // Position lever
    var z;
    if (id == 1 || id == 6) {
        z = .4;
    }
    if (id == 2 || id == 5) {
        z = 0;
    }
    if (id == 3 || id == 4) {
        z = -.4;
    }
    var rot;
    if (id <= 3) {
        rot = 90;
    } else {
        rot = 270;
    }
    $("#selectLever" + id).attr("position", "0 0 " + z);
    $("#selectLever" + id).attr("rotation", "-90 " + rot + " 0");
    $("#selectLever" + id).attr("scale", "0 0 0");
  $("#selectLever" + id)[0].flushToDOM(true); 
   updateHandControls();
}

// Show the level select screen
function showLevelSelect() {
    for (var i = 1; i <= 6; i++) {
        if (i == 1 || UNLOCK_ALL) {
            showLever(i, true);
        } else {
            if (userData.bestScores[i - 2].cleared) {
                showLever(i, true);
            } else {
                showLever(i, false);
            }
        }
    }
    inMenu = true;
}

// Show a single lever on the level select screen (isActive determines whether or not the lever can be used; if not it shows up transparent and without a handle)
function showLever(id, isActive) {
    if (isActive) {
        $("#lever" + id).attr("visible", "true");
        $("#leverScore" + id).attr("visible", "true");
        $("#selectLeverBall" + id).attr("visible", "true");
        $("#leverCrevice" + id).attr("visible", "true");
        $("#leverBox" + id).attr("opacity", "1");
    } else {
        $("#lever" + id).attr("visible", "false");
        $("#leverScore" + id).attr("visible", "false");
        $("#selectLeverBall" + id).attr("visible", "false");
        $("#leverCrevice" + id).attr("visible", "false");
        $("#leverBox" + id).attr("opacity", ".25");
    }
    $("#selectLever" + id).attr("scale", "1 1 1");
    var text = "NEW!";
    if (id < 6) {
        var levelScore = userData.bestScores[id - 1];
        if (levelScore.cleared) {
            text = "BEST\n" + formatTime(levelScore.time) + "\n[" + levelScore.moves + "]";
        }
    } else if (id == 6) {
        var score = userData.infiniteBestScore;
        if (score > 0) {
            text = "BEST\n" + score + "\nSTAGES";
        }
    }
    $("#leverScore" + id).attr("text", "value: " + text + ";");
    $({
        r: 0
    }).animate({
        r: 1
    }, {
        duration: 500,
        step: function () {
            $("#selectLever" + id).attr("rotation", (-90 * (1 - this.r)) + " " + (id <= 3 ? 90 : 270) + " 0");
        },
        easing: "easeInQuad"
    });
    setTimeout(function () {
        $("#selectLever" + id).attr("rotation", "0  " + (id <= 3 ? 90 : 270) + " 0");
    }, 510);
}

// Hide the level select screen
function hideLevelSelect() {
    for (var i = 1; i <= 6; i++) {
        hideLever(i);
    }
    hideTitleText();
}

// Hide a single lever from the level select screen
function hideLever(id) {
    $({
        r: 1
    }).animate({
        r: 0
    }, {
        duration: 500,
        step: function () {
            $("#selectLever" + id).attr("rotation", (-90 * (1 - this.r)) + " " + (id <= 3 ? 90 : 270) + " 0");
        },
        easing: "easeOutQuad"
    });
    setTimeout(function () {
        $("#selectLever" + id).attr("scale", "0 0 0");
    }, 510);
}

// Show the "exit to menu" lever
function showExitLever() {
    $("#exitLever").attr("scale", "1 1 1");
    $({
        r: 0
    }).animate({
        r: 1
    }, {
        duration: 500,
        step: function () {
            $("#exitLever").attr("rotation", (-90 * (1 - this.r)) + " 180 0");
        },
        easing: "easeInQuad"
    });
    setTimeout(function () {
        $("#exitLever").attr("rotation", "0 180 0");
    }, 510);
}

// Hide the "exit to menu" lever
function hideExitLever() {
    $({
        r: 1
    }).animate({
        r: 0
    }, {
        duration: 500,
        step: function () {
            $("#exitLever").attr("rotation", (-90 * (1 - this.r)) + " 180 0");
        },
        easing: "easeOutQuad"
    });
    setTimeout(function () {
        $("#exitLever").attr("scale", "0 0 0");
    }, 510);
}

function hideTitleText() {
    $("#titleText").attr("visible", "false");
}

function showTitleText() {
    $("#titleText").attr("visible", "true");
}

function startLevel(id) {
    $("#completeText").attr("scale", "0 0 0");
    $(".completeItem").attr("visible", "false");
    $("#infiniteEndText").attr("scale", "0 0 0");
    $(".infiniteEndItem").attr("visible", "false");
    totalMoves = 0;
    totalTime = 0;
    hideLevelSelect();
    currentChapter = id;
    currentLevel = 1;
    setupProgressLights(id);
    showProgressLights();
    setTimeout(function () {
        setLight(currentLevel, "active");
        loadLevelFromCode(currentChapter + "-" + currentLevel);
        showExitLever();
    }, 1000);
}

// Complete a level; animate the shapes fading out and move on to the next level if possible 
function completeLevel() {
    setLight(currentLevel, "complete");
    disableHandControls();
    endTime = (new Date()).getTime();
    var elapsed = Math.floor((endTime - startTime) / 1000);
    totalTime += elapsed;
    // Hide shapes
    $({
        r: 1
    }).animate({
        r: 0
    }, {
        duration: 1000,
        step: function () {
            $("#shapes").children().attr("material", "color: #ffffff; opacity: " + this.r);
        }
    });
    setTimeout(function () {
        $("#shapes").children().attr("material", "color: #ffffff; opacity: 0");
    }, 1050);
    setTimeout(function () {
        if (currentLevel < 7) {
            currentLevel++;
            setLight(currentLevel, "active");
            loadLevelFromCode(currentChapter + "-" + currentLevel);
        } else {
            showLevelCompleteScreen();
        }
    }, 1500);
}

function exitLevel() {
    disableHandControls();
    hideExitLever();
    clearMachine();
    showTitleText();
    setTimeout(function () {
        returnToMenu();
    }, 1000);
}

function showLevelCompleteScreen() {
    clearMachine();
    hideExitLever();
    $(".completeItem").attr("visible", "false");
    $("#completeTextTitle").attr("visible", "true");
    $("#completeTextTitle").attr("text", "value: LEVEL " + currentChapter + " COMPLETE; color: #2cb674;");
    $("#completeText1").attr("text", "value: ;");
    $("#completeText2").attr("text", "value: ;");
    $("#completeBest1").attr("text", "value: ;");
    $("#completeBest2").attr("text", "value: ;");
    var levelBestScore = userData.bestScores[currentChapter - 1];
    $({
        r: 0
    }).animate({
        r: 1
    }, {
        duration: 250,
        step: function () {
            $("#completeText").attr("scale", this.r + " " + this.r + " " + this.r);
        }
    });
    setTimeout(function () {
        var time = totalTime;
        $("#completeLabel1").attr("visible", "true");
        $("#completeText1").attr("visible", "true");
        $({
            r: 0
        }).delay(250).animate({
            r: 1
        }, {
            duration: 1000,
            step: function () {
                $("#completeText1").attr("text", "value: " + formatTime(Math.floor(time * this.r)) + ";");
            },
            easing: "easeOutCubic"
        });
        setTimeout(function () {
            $("#completeText1").attr("text", "value: " + formatTime(time) + ";");
            $("#completeBest1").attr("visible", "true");
            if (!levelBestScore.cleared || time < levelBestScore.time) {
                $("#completeBest1").attr("text", "value: NEW PERSONAL BEST!; color: #fffa79;");
                levelBestScore.time = time;
            } else {
                $("#completeBest1").attr("text", "value: YOUR BEST: " + formatTime(levelBestScore.time) + "; color: #a0a0a0;");
            }
        }, 1300);
    }, 500);
    setTimeout(function () {
        var moves = totalMoves;
        $("#completeLabel2").attr("visible", "true");
        $("#completeText2").attr("visible", "true");
        $({
            r: 0
        }).delay(250).animate({
            r: 1
        }, {
            duration: 1000,
            step: function () {
                $("#completeText2").attr("text", "value: " + Math.floor(moves * this.r) + ";");
            },
            easing: "easeOutCubic"
        });
        setTimeout(function () {
            $("#completeText2").attr("text", "value: " + moves + "; color: #ffffff; align: center");
            $("#completeBest2").attr("visible", "true");
            if (!levelBestScore.cleared || moves < levelBestScore.moves) {
                $("#completeBest2").attr("text", "value: NEW PERSONAL BEST!; color: #fffa79;");
                levelBestScore.moves = moves;
            } else {
                $("#completeBest2").attr("text", "value: YOUR BEST: " + levelBestScore.moves + "; color: #a0a0a0;");
            }
            levelBestScore.cleared = true;
            saveGame();
        }, 1300);
    }, 2000);
    setTimeout(function () {
        hideProgressLights();
        returnToMenu();
    }, 4000);
}

function returnToMenu() {
    updateHandControls();
    showLevelSelect();
}

function saveGame() {
    localStorage.setItem("tarskiSaveFile", JSON.stringify(userData));
}

// Clears the machine state
function clearMachine() {
    // Reset the level code and evaluation panels
    $("#levelCodeDisplay").attr("text", "value: ?;");
    $("#levelPanel").attr("color", "#444");
    $("#evalText").attr("text", "value: ?;");
    $("#evalPanel").attr("color", "#444");
    // Remove all the shapes
    $("#shapes").empty();
    // Hide the sentence panels
    $(".boardPanel").attr("visible", "false");
    // Remove the lasers
    $("#lasers").empty();
    // Remove the tutorial text
    $("#tutorial").empty();
    // Reset levers back to original positions
    for (var i = 1; i <= 7; i++) {
        $("#lever" + i).attr("position", "0 0 0");
    }
    // Clear the endgame score text
    $("#completeText").attr("scale", "0 0 0");
    $("#infiniteEndText").attr("scale", "0 0 0");
    // Clear infinite mode choice boxes
    $("#infChoices").attr("visible", "false");
    $("#infChoices").attr("position", "0 -2 0");
    // Clear the infinite choice panels
    for (var i = 0; i < 4; i++) {
        $("#statementTextInf" + i).attr("text", "value: ");
    }
    // Hide progress
    hideProgressLights();
    hideCenterCorner();
}

// Check to see if the center and corner markers should be displayed on the game board (use if InCenter or InCorner are used in the sentences for this level)
function checkCenterCorner() {
    var useCenter = false;
    var useCorner = false;
    for (var i = 0; i < sentences.length; i++) {
        if (sentences[i].indexOf("InCenter") !== -1) {
            useCenter = true;
        }
        if (sentences[i].indexOf("InCorner") !== -1) {
            useCorner = true;
        }
    }
    if (useCenter) {
        $("#centerMarker").attr("scale", "1 1 1");
    } else {
        $("#centerMarker").attr("scale", "0 0 0");
    }
    if (useCorner) {
        $("#cornerMarkers").attr("scale", "1 1 1");
    } else {
        $("#cornerMarkers").attr("scale", "0 0 0");
    }
}

// Hide the center and corner markers
function hideCenterCorner() {
    $("#centerMarker").attr("scale", "0 0 0");
    $("#cornerMarkers").attr("scale", "0 0 0");
}

// Update the watch on the left hand
function updateWatch() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var timeStr = "";
    var ampmStr = "";
    if (h >= 12) {
        timeStr = (h == 12 ? 12 : (h % 12)) + ":" + (m < 10 ? "0" + m : m);
        ampmStr = "PM";
    } else {
        timeStr = (h == 0 ? 12 : h) + ":" + (m < 10 ? "0" + m : m);
        ampmStr = "AM";
    }
    $("#watchTime").attr("text", "value: " + timeStr + ";");
    $("#watchAMPM").attr("text", "value: " + ampmStr + ";");
}

// Create the laser objects for this level
function makeLasers() {
    $("#lasers").empty('');
    for (var i = 0; i < lasers.length; i++) {
        makeLaser(i);
    }
}

// Create a laser object
function makeLaser(i) {
    setTimeout(function () {
        var laser = lasers[i];
        $("#lasers").append('<a-entity id="laser' + i + '" scale=".1 .1 .1" position="0 ' + (-.5 + .2 * laser.y) + ' ' + (-.5 + .2 * laser.z) + '" rotation="0 0 270"><a-entity position="0 -10 0"><a-entity mixin="laserDevice" position="0 .125 0"></a-entity><a-entity mixin="laserDevice" rotation="180 0 0" position="0 -.125 0"></a-entity><a-sphere color="' + colors[lasers[i].color] + '" radius=".4" position="0 0 0" segments-height="8" segments-radial="8"></a-sphere></a-entity><a-entity position="0 10 0"><a-entity mixin="laserDevice" position="0 .125 0"></a-entity><a-entity mixin="laserDevice" rotation="180 0 0" position="0 -.125 0"></a-entity><a-sphere color="' + colors[lasers[i].color] + '" radius=".4" position="0 0 0" segments-height="8" segments-radial="8"></a-sphere></a-entity><a-cylinder radius=".1" height="20" color="' + colors[lasers[i].color] + '" opacity=".35" position="0 0 0" segments-height="8" segments-radial="8"></a-cylinder></a-entity>');
    }, 50 * i);
}

// Not currently used: make a wall for the lasers to be on
function makeLaserWall() {
    var laserThickness = .005;
    $("#laserWall").empty();
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 2; j++) {
            $("#laserWall").append('<a-box mixin="laserWallGrid" scale=".003 ' + laserThickness + ' 1" position="' + (j == 0 ? 1 : -1) + ' ' + (-.5 + .2 * i) + ' 0"></a-box>');
            $("#laserWall").append('<a-box mixin="laserWallGrid" scale=".003 1 ' + laserThickness + '" position="' + (j == 0 ? 1 : -1) + ' 0 ' + (-.5 + .2 * i) + '"></a-box>');
        }
    }
}

// Pulse the ghost panel (used when the number of ghosted shapes changes)
function pulseGhostPanel() {
    $({
        r: 1
    }).animate({
        r: 0
    }, {
        duration: 250,
        step: function () {
            var scale = .5 + (.25 * this.r);
            $("#ghostCounter").attr("scale", scale + " " + scale + " " + scale);
        },
        easing: "easeOutCubic"
    });
}

// Shake the ghost panel (used when the player tries to ghost a shape but they're already at the limit)
function shakeGhostPanel() {
    $({
        r: 0
    }).animate({
        r: 1.5
    }, {
        duration: 150,
        step: function () {
            var y = -.015 * Math.sin(2 * Math.PI * this.r);
            $("#ghostCounter").attr("position", ".03 0 " + y);
        },
        easing: "linear"
    });
}

// Starts a game of infinite mode
function startInfiniteMode() {
    clearMachine();
    infiniteMode = true;
    // Prepare 27 unique shapes
    allShapes = [];
    var types = ["tet", "cube", "dodec"];
    var colors = ["red", "green", "blue"];
    var sizes = [.5, 1, 1.5];
    var shapeCodes = getShapePermutation();
    for (var i = 0; i < 27; i++) {
        var code = shapeCodes[i];
        var newShape = {
            "type": types[parseInt(code.charAt(0))],
            "color": colors[parseInt(code.charAt(1))],
            "size": sizes[parseInt(code.charAt(2))],
            "x": 0,
            "y": 0,
            "z": 0,
            "laserColor": "",
            "inWorld": true
        };
        allShapes.push(newShape);
    }
    // Clear shapes and add 3 from the allShapes list
    $("#shapes").empty();
    resetLaserColorMap();
    shapes = [];
    for (var i = 0; i < 3; i++) {
        addInfiniteShape(true);
    }
    // Reset statements and add one
    sentences = [];
    sentences.push("#x OnGround(x)");
    // Make a sentence bank
    for (var i = 0; i < 4; i++) {
        var newSentence = generateSentence(0);
        sentenceBank.push(newSentence);
    }
    updatePanels();
    updateSentenceBank();
    // Start level
    infiniteLevel = 0;
    infiniteMovesLeft = 10;
    updateMovesLeftText();
    startInfiniteLevel();
    showExitLever();
    $("#movesLeftPanel").attr("visible", "true");
    loadHelpTextFromCode("S-1");
    // Compute statements
    evaluateWorld();
}

function startInfiniteLevel() {
    infiniteLevel++;
    if (infiniteLevel == 2) {
        loadHelpTextFromCode("S-3");
    }
    fadeShapesIn();
    $("#levelCodeDisplay").attr("text", "value: S-" + infiniteLevel + ";");
    levelAlreadyCleared = false;
    hideInfChoices();
    updateHandControls();
    evaluateWorld();
}

function updateMovesLeftText() {
    $("#movesLeftNumber").attr("text", "value: " + infiniteMovesLeft + ";");
}

function completeInfiniteLevel() {
    fadeShapesOut();
    var bonusMoves = 3;
    infiniteMovesLeft += bonusMoves;
    updateMovesLeftText();
    if (infiniteLevel > 1 && infiniteLevel % 2 == 0) {
        addInfiniteShape(false);
        evaluateWorld();
    }
    disableHandControls();
    setTimeout(function () {
        showInfChoices();
    }, 1000);
}

function endInfiniteMode(conceded) {
    infiniteMode = false;
    showInfiniteEndScreen(conceded);
}

function showInfiniteEndScreen(conceded) {
    clearMachine();
    hideExitLever();
    lowerMachineArms();
    $(".infiniteEndItem").attr("visible", "false");
    $("#infiniteEndTextTitle").attr("visible", "true");
    if (!conceded) {
        $("#infiniteEndTextTitle").attr("text", "value: OUT OF MOVES; color: #ff3333;");
    } else {
        $("#infiniteEndTextTitle").attr("text", "value: GAME ENDED; color: #ff3333;");
    }
    $("#infiniteEndText1").attr("text", "value: ;");
    $("#infiniteEndBest1").attr("text", "value: ;");
    $({
        r: 0
    }).animate({
        r: 1
    }, {
        duration: 250,
        step: function () {
            $("#infiniteEndText").attr("scale", this.r + " " + this.r + " " + this.r);
        }
    });
    setTimeout(function () {
        var score = infiniteLevel - 1;
        $("#infiniteEndLabel1").attr("visible", "true");
        $("#infiniteEndText1").attr("visible", "true");
        $({
            r: 0
        }).delay(250).animate({
            r: 1
        }, {
            duration: 1000,
            step: function () {
                $("#infiniteEndText1").attr("text", "value: " + Math.floor(score * this.r) + ";");
            },
            easing: "easeOutCubic"
        });
        setTimeout(function () {
            $("#infiniteEndText1").attr("text", "value: " + score + ";");
            $("#infiniteEndBest1").attr("visible", "true");
            if (score > userData.infiniteBestScore) {
                $("#infiniteEndBest1").attr("text", "value: NEW PERSONAL BEST!; color: #fffa79;");
                userData.infiniteBestScore = score;
            } else {
                $("#infiniteEndBest1").attr("text", "value: YOUR BEST: " + userData.infiniteBestScore + "; color: #a0a0a0;");
            }
            saveGame();
        }, 1300);
    }, 500);
    setTimeout(function () {
        returnToMenu();
    }, 3000);
}


function resetLaserColorMap() {
    // Prepare laser color map
    for (var m = 0; m < 6; m++) {
        laserColorMap[m] = [];
        for (var n = 0; n < 6; n++) {
            laserColorMap[m][n] = "";
        }
    }
}

function raiseMachineArms() {
    $({
        r: 0
    }).animate({
        r: .5
    }, {
        duration: 500,
        step: function () {
            $(".machineArm").attr("position", "0 " + this.r + " 0");
            $("#subBoxLeft").attr("position", (2.5 - 5 * this.r) + " 0 0");
            $("#subBoxRight").attr("position", (-2.5 + 5 * this.r) + " 0 0");
        }
    });
    setTimeout(function () {
        $(".machineArm").attr("position", "0 .5 0");
        $("#subBoxLeft").attr("position", "0 0 0");
        $("#subBoxRight").attr("position", "0 0 0");
    }, 550);
}

function lowerMachineArms() {
    $("#movesLeftPanel").attr("visible", "false");
    $({
        r: .5
    }).animate({
        r: 0
    }, {
        duration: 500,
        step: function () {
            $(".machineArm").attr("position", "0 " + this.r + " 0");
            $("#subBoxLeft").attr("position", (2.5 - 5 * this.r) + " 0 0");
            $("#subBoxRight").attr("position", (-2.5 + 5 * this.r) + " 0 0");
        }
    });
    setTimeout(function () {
        $(".machineArm").attr("position", "0 0 0");
        $("#subBoxLeft").attr("position", "2.5 0 0");
        $("#subBoxRight").attr("position", "-2.5 0 0");
    }, 550);
}

function fadeShapesOut() {
    $({
        r: 0
    }).animate({
        r: 1.5
    }, {
        duration: 1500,
        step: function () {
            if (this.r < 1) {
                $("#shapes").children().attr("material", "color: #ffffff; opacity: " + (1 - this.r));
            } else {
                applyLaserColors();
                for (var i = 0; i < shapes.length; i++) {
                    $("#shape" + i).attr("material", "color: " + colors[shapes[i].laserColor] + "; opacity: " + (.6 * (this.r - 1)));
                }
            }
        }
    });
    setTimeout(function () {
        $(".shape").attr("opacity", .2);
    }, 1550);
}

function fadeShapesIn() {
    $({
        r: .2
    }).animate({
        r: 1
    }, {
        duration: 250,
        step: function () {
            $(".shape").attr("opacity", this.r);
        }
    });
    setTimeout(function () {
        $(".shape").attr("opacity", 1);
    }, 275);
}

function addInfiniteShape(inAir) {
    if (allShapes.length > 0) {
        var i = shapes.length;
        // Get the next shape from allShapes
        var newShape = allShapes[0];
        // Remove it from allShapes
        allShapes.splice(0, 1);
        // Position it so that it doesn't overlap with any existing shapes
        var isOK = false;
        while (!isOK) {
            isOK = true;
            var x = Math.floor(6 * Math.random());
            var y = Math.floor(6 * Math.random());
            if (inAir) {
                y = Math.floor(5 * Math.random()) + 1;
            }
            var z = Math.floor(6 * Math.random());
            for (var i = 0; i < shapes.length; i++) {
                var checkShape = shapes[i];
                if (checkShape.x == x && checkShape.y == y && checkShape.z == z) {
                    isOK = false;
                }
            }
        }
        newShape.x = x;
        newShape.y = y;
        newShape.z = z;
        // Add the new shape to the shapes list
        shapes.push(newShape);
        // Make the shape
        var toInsert = "";
        // Set type
        if (newShape.type == "cube") {
            var size = .1 * newShape.size;
            toInsert += '<a-box id="shape' + i + '"  clickable class="shape" scale="' + size + ' ' + size + ' ' + size + '"></a-box>';
        } else if (newShape.type == "dodec") {
            var radius = .065 * newShape.size;
            toInsert += '<a-dodecahedron id="shape' + i + '"  clickable class="shape" radius="' + radius + '"></a-dodecahedron>';
        } else if (newShape.type == "tet") {
            var radius = .075 * newShape.size;
            toInsert += '<a-tetrahedron id="shape' + i + '"  clickable  class="shape" radius="' + radius + '"></a-tetrahedron>';
        }
        $("#shapes").append(toInsert);
        // Animate shape entrance
        shapeEnter(i);
        updateHandControls();
    }
}

function generateSentence(rule) {
    var sentence = "";
    var props = ["Red", "Green", "Blue", "Cube", "Dodec", "Tetra", "Small", "Medium", "Large"];
    var places = ["OnGround", "InCorner", "InCenter"];
    var dirs = ["Above", "Below", "NorthOf", "SouthOf", "WestOf", "EastOf"];
    if (rule == 0) {
        // Simple Equivalence
        // Exclude existing simple equivalence props
        for (var i = 0; i < sentences.length; i++) {
            var s = sentences[i];
            if (s.indexOf("@x") != -1 && s.indexOf("@y") == -1) {
                // It's a simple equivalence sentence
                for (var j = props.length - 1; j >= 0; j--) {
                    if (s.indexOf(props[j]) != -1) {
                        props.splice(j, 1);
                    }
                }
            }
        }
        var randomProp = props[Math.floor(props.length * Math.random())];
        var randomPlace = places[Math.floor(places.length * Math.random())];
        sentence = "@x " + randomProp + "(x)" + ">" + (Math.random() < .25 ? "~" : "") + randomPlace + "(x)";
    } else if (rule == 1) {
        // Comparison
        var type = Math.floor(3 * Math.random());
        var randomDir = pickFromList(dirs, 1);
        if (type == 0) {
            // Size
            sentence = "@x @y " + (Math.random() < .5 ? "Smaller" : "Larger") + "(x,y)" + (Math.random() < .5 ? ">" : "=") + (Math.random() < .25 ? "~" : "") + randomDir[0] + "(x,y)";
        } else if (type == 1) {
            // Shape
            var shapeTypes = ["Tetra", "Cube", "Dodec"];
            var randomShapes = pickFromList(shapeTypes, 2);
            sentence = "@x @y (" + randomShapes[0] + "(x)&" + randomShapes[1] + "(y))" + ">" + (Math.random() < .25 ? "~" : "") + randomDir[0] + "(x,y)";
        } else if (type == 2) {
            // Colors
            var colorTypes = ["Red", "Green", "Blue"];
            var randomColors = pickFromList(colorTypes, 2);
            sentence = "@x @y (" + randomColors[0] + "(x)&" + randomColors[1] + "(y))" + ">" + (Math.random() < .25 ? "~" : "") + randomDir[0] + "(x,y)";
        }
    } else if (rule == 2) {
        // Existence of an element for each element
        var randomProp = pickFromList(props, 1);
        var randomDir = pickFromList(dirs, 1);
        if (Math.random() < .3) {
            sentence = "@x #y " + randomProp[0] + "(y)&(Adjacent(x,y)|Equals(x,y))";
        } else {
            sentence = "@x #y " + randomProp[0] + "(y)&~" + randomDir[0] + "(x,y)";
        }
    }
    return sentence;
}

function generateNonTrivialSentence(rule) {
    var attempts = 0;
    var isOK = false;
    var sentence = "";
    while (!isOK && attempts < 10) {
        attempts++;
        // Generate a random sentence
        sentence = generateSentence(rule);
        // Check if the sentence is already true; if not, accept it
        var testSentences = [];
        for (var i = 0; i < sentences.length; i++) {
            testSentences.push(sentences[i]);
        }
        testSentences.push(sentence);
        var testEval = runWorldEvaluation(shapes, testSentences);
        if (!testEval) {
            isOK = true;
        }
    }
    return sentence;
}

function updateSentenceBank() {
    for (var i = 0; i < sentenceBank.length; i++) {
        $("#statementTextInf" + i).attr("text", "value: " + formatSentence(sentenceBank[i]));
    }
}

function showInfChoices() {
    if (infiniteLevel == 1) {
        loadHelpTextFromCode("S-2");
    } else if (infiniteLevel == 2) {
        loadHelpTextFromCode("S-4");
    } else {
        loadHelpTextFromCode("");
    }
    $("#infChoices").attr("visible", "true");
    $({
        r: -2
    }).animate({
        r: 0
    }, {
        duration: 500,
        step: function () {
            $("#infChoices").attr("position", "0 " + this.r + " 0");
        }
    });
    setTimeout(function () {
        $("#infChoices").attr("position", "0 0 0");
    }, 550);
}

function hideInfChoices() {
    $({
        r: 0
    }).animate({
        r: -2
    }, {
        duration: 500,
        step: function () {
            $("#infChoices").attr("position", "0 " + this.r + " 0");
        }
    });
    setTimeout(function () {
        $("#infChoices").attr("position", "0 -2 0");
        $("#infChoices").attr("visible", "false");
    }, 550);
}

// Select an infinite mode choice
function selectInfChoice(id) {
    sentences.push(sentenceBank[id]);
    if (sentences.length > 3) {
        sentences.splice(0, 1);
    }
    console.log("level " + infiniteLevel);
    var rule = 0;
    if (infiniteLevel > infRuleOrder.length) {
        rule = 2;
    } else {
        rule = infRuleOrder[infiniteLevel - 1];
    }
    if (id <= 1) {
        sentenceBank[0] = generateNonTrivialSentence(rule);
        sentenceBank[1] = generateNonTrivialSentence(rule);
    } else {
        sentenceBank[2] = generateNonTrivialSentence(rule);
        sentenceBank[3] = generateNonTrivialSentence(rule);
    }
    updatePanels();
    updateSentenceBank();
    checkCenterCorner();
    startInfiniteLevel();
}

function makeInfOrder() {
    infRuleOrder = [];
    for (var i = 0; i < 2; i++) {
        infRuleOrder.push(0);
    }
    for (var i = 0; i < 2; i++) {
        infRuleOrder.push(0);
        infRuleOrder.push(1);
    }
    for (var i = 0; i < 100; i++) {
        infRuleOrder.push(0);
        infRuleOrder.push(1);
        infRuleOrder.push(2);
        infRuleOrder.push(1);
        infRuleOrder.push(2);
    }
}

function pickFromList(array, count) {
    var picked = [];
    var indices = [];
    for (var i = 0; i < array.length; i++) {
        indices.push(i);
    }
    for (var i = 0; i < count; i++) {
        var r = indices[Math.floor(Math.random() * indices.length)];
        picked.push(array[r]);
        indices.splice(r, 1);
    }
    return picked;
}
