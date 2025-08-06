import settings from "../config";

let inDungeon = false;
let playerClass = "EMPTY";
let locationCheckActive = false;
let tabCheckActive = false;

const TAB_REGEX = /^\[(\d+)\]\s+(\S+)(?:\s+(\S+))?\s+\(([^)]+)\)$/;

function stripColors(s) {
    try { return String(s || "").replace(/§[0-9a-fk-or]/gi, ""); }
    catch (e) { return "" + s; }
}

function toArraySafe(javaObj) {
    try {
        if (javaObj && typeof javaObj.size === "function" && typeof javaObj.get === "function") {
            const len = javaObj.size();
            const out = [];
            for (let i = 0; i < len; i++) out.push(javaObj.get(i));
            return out;
        }
    } catch (e1) {}

    try {
        if (javaObj && typeof javaObj.toArray === "function") {
            const arr = javaObj.toArray();
            const out2 = [];
            for (let j = 0; j < arr.length; j++) out2.push(arr[j]);
            return out2;
        }
    } catch (e2) {}

    try {
        if (javaObj && typeof javaObj.length === "number") {
            const out3 = [];
            for (let k = 0; k < javaObj.length; k++) out3.push(javaObj[k]);
            return out3;
        }
    } catch (e3) {}

    try {
        if (javaObj && typeof javaObj.iterator === "function") {
            const it = javaObj.iterator();
            const out4 = [];
            while (it.hasNext()) out4.push(it.next());
            return out4;
        }
    } catch (e4) {}

    return [];
}

function getLocationLine() {
    try {
        const raw = Scoreboard.getLines(true);
        const lines = [];
        for (let i = 0; i < raw.length; i++) {
            const sc = raw[i];
            const name = sc && sc.getName ? sc.getName() : "";
            if (!name) continue;
            lines.push(stripColors(name));
        }
        for (let i = 0; i < lines.length; i++) {
            const L = lines[i];
            if (L && L.indexOf("⏣") !== -1) return L;
        }
        return null;
    } catch (e) {
        return null;
    }
}

function extractLocation(locLine) {
    if (!locLine) return null;
    const parts = locLine.split("⏣");
    if (!parts || parts.length < 2) return null;
    const rawLoc = (parts[1] || "").trim();
    const cleaned = rawLoc.replace(/[^\x20-\x7E]/g, "").trim();
    return cleaned;
}

function extractClass(classStr) {
    if (!classStr || classStr === "EMPTY") return "EMPTY";
    const lower = classStr.toLowerCase();
    if (lower.indexOf("archer") === 0) return "Archer";
    if (lower.indexOf("mage") === 0) return "Mage";
    if (lower.indexOf("berserker") === 0 ) return "Berserker";
    if (lower.indexOf("healer") === 0) return "Healer";
    if (lower.indexOf("tank") === 0) return "Tank";
    return classStr.charAt(0).toUpperCase() + classStr.slice(1).toLowerCase();
}

let loggedTabGetNamesOnce = false;
function getTabLines() {
    try {
        if (typeof TabList !== "undefined" && typeof TabList.getNames === "function") {
            const j = TabList.getNames();
            const arr = toArraySafe(j);
            const out = [];
            for (let i = 0; i < arr.length; i++) out.push(stripColors(String(arr[i])));
            return out;
        }
    } catch (e) {
        if (!loggedTabGetNamesOnce) {
            loggedTabGetNamesOnce = true;
        }
    }
    return [];
}

function checkLocation() {
    if (!settings.enabled || !locationCheckActive) return;

    const locLine = getLocationLine();
    if (!locLine) return;

    const location = extractLocation(locLine);
    if (!location) return;

    if (location.toLowerCase() === "none") return;

    if (location.indexOf("The Catacombs") === 0) {
        if (!inDungeon) {
            inDungeon = true;
            tabCheckActive = true;
            playerClass = "EMPTY";
        }
    } else {
        inDungeon = false;
        tabCheckActive = false;
        locationCheckActive = false;
        playerClass = "EMPTY";
    }
}

function checkTabList() {
    if (!settings.enabled || !inDungeon || !tabCheckActive) return;

    const lines = getTabLines();
    if (!lines.length) return;

    let myName = "";
    try { myName = Player.getName(); } catch (e) { myName = ""; }

    if (myName) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.indexOf(myName) === -1) continue;

            const match = TAB_REGEX.exec(line);
            if (!match) continue;

            const classStr = match[4];
            if (!classStr || classStr === "EMPTY") {
                return;
            }

            playerClass = extractClass(classStr);
            tabCheckActive = false;
            return;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const match = TAB_REGEX.exec(line);
        if (!match) continue;

        const classStr = match[4];
        if (!classStr || classStr === "EMPTY") continue;

        playerClass = extractClass(classStr);
        tabCheckActive = false;
        return;
    }
}

register("worldLoad", function () {
    inDungeon = false;
    playerClass = "EMPTY";
    tabCheckActive = false;

    if (settings.enabled) {
        locationCheckActive = true;
    } else {
        locationCheckActive = false;
    }
});

register("worldUnload", function () {
    inDungeon = false;
    playerClass = "EMPTY";
    locationCheckActive = false;
    tabCheckActive = false;
    loggedTabGetNamesOnce = false;
});

register("step", function () {
    checkLocation();
    checkTabList();
}).setFps(3);

module.exports = {
    get inDungeon() { return inDungeon; },
    get playerClass() { return playerClass; },
    get isArcher() { return playerClass === "Archer"; },
    get isMage() { return playerClass === "Mage"; },
    get isBerserker() { return playerClass === "Berserker"; },
    get isHealer() { return playerClass === "Healer"; },
    get isTank() { return playerClass === "Tank"; },
    get isEmpty() { return playerClass === "EMPTY"; }
};

/*
    register("command", function () {
        console.log("[Utils] DEBUG TABLIST");
        const lines = getTabLines();
        console.log("Nb lines: " + lines.length);
        for (let i = 0; i < Math.min(lines.length, 30); i++) {
            const line = lines[i];
            const m = TAB_REGEX.exec(line);
            if (m) {
                console.log("[" + i + "] " + line);
                console.log("    Level: " + m[1] + ", Name: " + m[2] + ", Emblem: " + (m[3] || "(none)") + ", Class: " + m[4]);
            } else {
                console.log("[" + i + "] " + line + " (no match)");
            }
        }
        console.log("========================================");
        
        console.log("[Utils] STATUS");
        console.log("settings.enabled: " + settings.enabled);
        console.log("inDungeon: " + inDungeon);
        console.log("playerClass: " + playerClass);
        console.log("locationCheckActive: " + locationCheckActive);
        console.log("tabCheckActive: " + tabCheckActive);

        const locLine = getLocationLine();
        const location = extractLocation(locLine);
        console.log("Location: " + (location || "none"));

        const tabLines = getTabLines();
        console.log("TabList entries: " + tabLines.length);
        console.log("========================================");
    }).setName("debug");
*/
