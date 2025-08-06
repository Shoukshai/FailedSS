const dungeonUtils = {
    inDungeon: false
};
module.exports = dungeonUtils;

let prevLocation = "";

register("worldLoad", () => {
    prevLocation = "";
    dungeonUtils.inDungeon = false;
});
register("worldUnload", () => {
    prevLocation = "";
    dungeonUtils.inDungeon = false;
});

register("renderScoreboard", () => {
    const lines = Scoreboard.getLines(true).map(l =>
        l.getName().replace(/§[0-9a-fk-or]/gi, "")
    );

    const locLine = lines.find(l => l.includes("⏣"));
    if (!locLine) {
        dungeonUtils.inDungeon = false;
        return;
    }

    const rawLoc = locLine.split("⏣")[1]?.trim() || "";
    const cleaned = rawLoc.replace(/[^\x20-\x7E]/g, "").trim();

    dungeonUtils.inDungeon = cleaned.startsWith("The Catacombs");

    if (cleaned && cleaned.toLowerCase() !== "none" && cleaned !== prevLocation) {
        // console.log(`[Player Location] ${cleaned}`);
        prevLocation = cleaned;
    }
});