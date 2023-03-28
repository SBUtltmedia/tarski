var EXIST_CHAR = "#";
var FORALL_CHAR = "@";

function evalBoolSentence(sentence) {
    str = sentence + "";
    var loops = 0;
    while (str.length > 1 && loops < 50000) {
        loops++;
        // Remove extraneous parentheses
        str = iterReplaceGroup(str, [["(T)", "T"], ["(F)", "F"]]);
        // Negations
        str = iterReplaceGroup(str, [["~T", "F"], ["~F", "T"]]);
        // And
        str = iterReplaceGroup(str, [["T&T", "T"], ["T&F", "F"], ["F&T", "F"], ["F&F", "F"]]);
        // Or
        str = iterReplaceGroup(str, [["T|T", "T"], ["T|F", "T"], ["F|T", "T"], ["F|F", "F"]]);
        // Xor
        str = iterReplaceGroup(str, [["T+T", "F"], ["T+F", "T"], ["F+T", "T"], ["F+F", "F"]]);
        // Implies
        str = iterReplaceGroup(str, [["T>T", "T"], ["T>F", "F"], ["F>T", "T"], ["F>F", "T"]]);
        // Biconditional
        str = iterReplaceGroup(str, [["T=T", "T"], ["T=F", "F"], ["F=T", "F"], ["F=F", "T"]]);
    }
    return str;
}

function iterReplaceGroup(inputStr, rules) {
    // Check if there is anything to be replaced
    var ok = true;
    var str = inputStr + "";
    for (var i = 0; i < rules.length; i++) {
        if (str.indexOf(rules[i][0]) !== -1) {
            ok = false;
        }
    }
    if (!ok) {
        for (var i = 0; i < rules.length; i++) {
            str = iterReplace(str, rules[i][0], rules[i][1]);
        }
    }
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

function evalWorldStatement(sentence, objects) {
    var str = sentence + "";
    // Equality function
    str = evalWorldStatementPart(str, objects, "Equals", function (params) {
        if (params[0] == params[1]) {
            return "T";
        } else {
            return "F";
        }
    });
    // Check directions (north, south, east, west, above, below)
    str = evalWorldStatementPart(str, objects, "NorthOf", function (params) {
        if (objects[params[0]].z < objects[params[1]].z) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "SouthOf", function (params) {
        if (objects[params[0]].z > objects[params[1]].z) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "WestOf", function (params) {
        if (objects[params[0]].x < objects[params[1]].x) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "EastOf", function (params) {
        if (objects[params[0]].x > objects[params[1]].x) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Below", function (params) {
        if (objects[params[0]].y < objects[params[1]].y) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Above", function (params) {
        if (objects[params[0]].y > objects[params[1]].y) {
            return "T";
        } else {
            return "F";
        }
    });
    // Size functions
    str = evalWorldStatementPart(str, objects, "Smaller", function (params) {
        if (objects[params[0]].size < objects[params[1]].size) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Larger", function (params) {
        if (objects[params[0]].size > objects[params[1]].size) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "SameSize", function (params) {
        if (objects[params[0]].size == objects[params[1]].size) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Small", function (params) {
        if (objects[params[0]].size < 1) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Medium", function (params) {
        if (objects[params[0]].size == 1) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Large", function (params) {
        if (objects[params[0]].size > 1) {
            return "T";
        } else {
            return "F";
        }
    });
    // Shape functions
    str = evalWorldStatementPart(str, objects, "SameShape", function (params) {
        if (objects[params[0]].type == objects[params[1]].type) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Tetra", function (params) {
        if (objects[params[0]].type == "tet") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Cube", function (params) {
        if (objects[params[0]].type == "cube") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Dodec", function (params) {
        if (objects[params[0]].type == "dodec") {
            return "T";
        } else {
            return "F";
        }
    });
    // Color functions
    str = evalWorldStatementPart(str, objects, "SameColor", function (params) {
        if (objects[params[0]].laserColor == objects[params[1]].laserColor) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Red", function (params) {
        if (objects[params[0]].laserColor == "red") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Green", function (params) {
        if (objects[params[0]].laserColor == "green") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Blue", function (params) {
        if (objects[params[0]].laserColor == "blue") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Orange", function (params) {
        if (objects[params[0]].laserColor == "orange") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Purple", function (params) {
        if (objects[params[0]].laserColor == "purple") {
            return "T";
        } else {
            return "F";
        }
    });
    // Other position functions
    str = evalWorldStatementPart(str, objects, "OnGround", function (params) {
        if (objects[params[0]].y == "0") {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "InCenter", function (params) {
        if ((objects[params[0]].x == "2" || objects[params[0]].x == "3") && (objects[params[0]].z == "2" || objects[params[0]].z == "3")) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "InCorner", function (params) {
        if ((objects[params[0]].x == "0" || objects[params[0]].x == "5") && (objects[params[0]].z == "0" || objects[params[0]].z == "5")) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalWorldStatementPart(str, objects, "Adjacent", function (params) {
        var dist = Math.abs(objects[params[0]].x - objects[params[1]].x) + Math.abs(objects[params[0]].y - objects[params[1]].y) + Math.abs(objects[params[0]].z - objects[params[1]].z);
        if (dist == 1) {
            return "T";
        } else {
            return "F";
        }
    });
    str = evalBoolSentence(str);
    return str;
}

function evalWorldStatementPart(str, objects, fnName, fnEval) {
    var done = false;
    var truth;
    while (!done) {
        var index = str.indexOf(fnName);
        if (index !== -1) {
            params = getStringParams(str, index, ")");
            truth = fnEval(params);
            str = str.replace(fnName + "(" + strConcat(params, ",") + ")", truth);
        } else {
            done = true;
        }
    }
    return str;
}

function getStringParams(str, index, endChar) {
    var params = [];
    var currentParam = "";
    var count = 0;
    for (var i = index; str.charAt(i - 1) != endChar && i < str.length; i++) {
        count++;
        var currentChar = str.charAt(i);
        if (currentChar >= '0' && currentChar <= '9') {
            currentParam += currentChar;
        } else {
            if (currentParam != "") {
                params.push(currentParam);
                currentParam = "";
            }
        }
    }
    for (var i = 0; i < params.length; i++) {
        params[i] = parseInt(params[i]);
    }
    return params;
}

function evalQuantifiedStatement(sentence, objects) {
    var str = sentence + "";
    return evalQSHelper(str, objects);
}

function evalQSHelper(sentence, objects) {
    var str = sentence + "";
    var first = str.charAt(0);
    if (first == EXIST_CHAR || first == FORALL_CHAR) {
        // Quantifier
        var quant = str.charAt(0);
        var currentVar = str.charAt(1);
        var rest = str.slice(3, str.length);
        var count = 0;
        var objectsInWorld = 0;
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].inWorld) {
                objectsInWorld++;
                var newRest = iterReplace(rest, currentVar, i);
                if (evalQSHelper(newRest, objects) == "T") {
                    count++;
                }
            }
        }
        if (quant == EXIST_CHAR) {
            if (count > 0) {
                return "T";
            } else {
                return "F";
            }
        }
        if (quant == FORALL_CHAR) {
            if (count == objectsInWorld) {
                return "T";
            } else {
                return "F";
            }
        }
    } else {
        // No quantifier
        return evalWorldStatement(str, objects);
    }
}

function evaluateWorld() {
    console.log("evaluate world");
    applyLaserColors();
    var worldEval = runWorldEvaluation(shapes, sentences);
    if (worldEval) {
        // Word evaluates to true
        $("#evalPanel").attr("color", "#00b359");
        $("#evalText").attr("text", "value: TRUE;");
        if (!levelAlreadyCleared) {
            levelAlreadyCleared = true;
            if (infiniteMode) {
                completeInfiniteLevel();
            } else {
                completeLevel();
            }
        }
    } else {
        $("#evalPanel").attr("color", "#ff4d4d");
        $("#evalText").attr("text", "value: FALSE;");
    }
    // Check if game is over
    if (infiniteMode) {
        console.log(infiniteMovesLeft);
        if (infiniteMovesLeft <= 0) {
            endInfiniteMode(false);
        }
    }
}

function applyLaserColors() {
    // For each shape...
    for (var i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        var laserColor = laserColorMap[shape.y][shape.z];
        // If the laser color for that row is empty, just use the shape's actual color. Otherwise, use the laser's color.
        if (laserColor != "") {
            shape.laserColor = laserColor;
        } else {
            shape.laserColor = shape.color;
        }
        // Set the actual shape mesh's color
        $("#shape" + i).attr("color", colors[shape.laserColor]);
    }
}

function runWorldEvaluation(shapes, sentences) {
    var totalEval = true;
    for (var i = 0; i < sentences.length; i++) {
        var value = evalQuantifiedStatement(sentences[i], shapes);
        if (value == "T") {
            $("#truthPanel" + i).attr("color", "#00b359");
            $("#truthText" + i).attr("text", "value: T;");
        } else {
            totalEval = false;
            $("#truthPanel" + i).attr("color", "#ff4d4d");
            $("#truthText" + i).attr("text", "value: F;");
        }
    }
    return totalEval;
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