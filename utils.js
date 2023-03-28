// Better than parseInt() in that it detects the first integer in a string even if it starts with something that is not a number.  Still returns NaN if no integers are found.
function betterParseInt(s) {
    var str = s + "";
    while (isNaN(parseInt(str)) && str.length > 0) {
        str = str.substring(1, str.length);
    }
    return parseInt(str);
}

function strConcat(arr, c) {
    out = "" + arr[0];
    for (var i = 1; i < arr.length; i++) {
        out += "," + arr[i];
    }
    return out;
}

function formatTime(n) {
    var m = Math.floor(n);
    var hr = Math.floor(m / 3600);
    m -= 3600 * hr;
    var min = Math.floor(m / 60);
    m -= 60 * min;
    var sec = m;
    return (hr > 0 ? hr + ":" : "") + (min < 10 && hr != 0 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}

function shuffle(array) {
    var m = array.length,
        t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

function leftpad(str, len, ch) {
    str = String(str);
    var i = -1;
    if (!ch && ch !== 0) ch = ' ';
    len = len - str.length;
    while (++i < len) {
        str = ch + str;
    }
    return str;
}