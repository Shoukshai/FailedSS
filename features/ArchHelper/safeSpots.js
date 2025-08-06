import settings from "../../config";

const ssCells = [
    { x: 111, y: 120, z: 92 }, { x: 111, y: 121, z: 92 }, { x: 111, y: 122, z: 92 }, { x: 111, y: 123, z: 92 },
    { x: 111, y: 120, z: 93 }, { x: 111, y: 121, z: 93 }, { x: 111, y: 122, z: 93 }, { x: 111, y: 123, z: 93 },
    { x: 111, y: 120, z: 94 }, { x: 111, y: 121, z: 94 }, { x: 111, y: 122, z: 94 }, { x: 111, y: 123, z: 94 },
    { x: 111, y: 120, z: 95 }, { x: 111, y: 121, z: 95 }, { x: 111, y: 122, z: 95 }, { x: 111, y: 123, z: 95 }
];

let isP3Active = false;
let totalLantern = 0;
let previousBlockStates = {};
let shouldShowAlert = false;
let phaseThreeStartTime = 0;
let hasAlertedAlready = false;
let alertSoundThread = null;

const alertText = new Text("&cSafe Spot!").setScale(5).setShadow(true)

function getSafeSpotDetection() {
    return settings.archSafeSpotDetection | 0;
}

function isSeaLanternsDetection() {
    return getSafeSpotDetection() === 0;
}

function isTimerDetection() {
    return getSafeSpotDetection() === 1;
}

register("chat", function() {
    if (!settings.enabled || !settings.archSafeSpot) return;
    isP3Active = true;
    totalLantern = 0;
    previousBlockStates = {};
    phaseThreeStartTime = Date.now();
    hasAlertedAlready = false;
    if (alertSoundThread) {
        alertSoundThread.interrupt();
        alertSoundThread = null;
    }
}).setChatCriteria("[BOSS] Storm: I should have known that I stood no chance.");

register("chat", function() {
    if (!settings.enabled || !settings.archSafeSpot) return;
    isP3Active = false;
    totalLantern = 0;
    previousBlockStates = {};
    shouldShowAlert = false;
    hasAlertedAlready = false;
    if (alertSoundThread) {
        alertSoundThread.interrupt();
        alertSoundThread = null;
    }
}).setChatCriteria("[BOSS] Goldor: Necron, forgive me.");

register("worldUnload", function() {
    isP3Active = false;
    totalLantern = 0;
    previousBlockStates = {};
    shouldShowAlert = false;
    hasAlertedAlready = false;
    if (alertSoundThread) {
        alertSoundThread.interrupt();
        alertSoundThread = null;
    }
});

function isSeaLanternBlock(x, y, z) {
    try {
        const block = World.getBlockAt(x, y, z);
        if (!block) return false;

        const blockType = block.type;
        if (blockType && blockType.mcBlock) {
            const blockId = blockType.mcBlock.func_149682_b(blockType.mcBlock);
            if (blockId === 169) return true;
        }

        const registryName = block.getRegistryName ? block.getRegistryName() : null;
        if (registryName === "minecraft:sea_lantern") return true;

        const blockString = block.toString();
        if (blockString && blockString.includes("sea_lantern")) return true;

        return false;
    } catch (e) {
        return false;
    }
}

function triggerSafeSpotAlert() {
    if (shouldShowAlert) return;
    shouldShowAlert = true;
    hasAlertedAlready = true;
    
    World.playSound("note.pling", 1, 1);
    
    alertSoundThread = new Thread(() => {
        const alertDuration = settings.archSafeSpotLength || 1000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < alertDuration) {
            try {
                Thread.sleep(10);
                if (Date.now() - startTime < alertDuration) {
                    World.playSound("note.pling", 1, 1.5);
                }
            } catch (e) {
                break;
            }
        }
        
        shouldShowAlert = false;
        alertSoundThread = null;
    });
    
    alertSoundThread.start();
}

register("step", function() {
    if (!settings.enabled || !settings.archSafeSpot || !isP3Active || hasAlertedAlready) return;

    try {
        const currentTime = Date.now();
        const elapsedTimeSincePhaseThree = currentTime - phaseThreeStartTime;

        for (let i = 0; i < ssCells.length; i++) {
            const cell = ssCells[i];
            const cellKey = cell.x + "," + cell.y + "," + cell.z;

            const isCurrentlySeaLantern = isSeaLanternBlock(cell.x, cell.y, cell.z);
            const wasSeaLanternBefore = previousBlockStates[cellKey] || false;

            if (isCurrentlySeaLantern && !wasSeaLanternBefore) {
                totalLantern++;
            }

            previousBlockStates[cellKey] = isCurrentlySeaLantern;
        }

        if (isSeaLanternsDetection()) {
            const lanternThreshold = settings.archSafeSpotLanternsThreshold || 16;
            if (totalLantern >= lanternThreshold) {
                triggerSafeSpotAlert();
            }
        }

        if (isTimerDetection()) {
            const timerThresholdMs = (settings.archSafeSpotTimer || 35) * 1000;
            if (elapsedTimeSincePhaseThree >= timerThresholdMs) {
                triggerSafeSpotAlert();
            }
        }
    } catch (e) {}
}).setFps(10);

register('renderOverlay', () => {
    if (shouldShowAlert) {
        alertText.draw((Renderer.screen.getWidth() - alertText.getWidth()) / 2, (Renderer.screen.getHeight() - alertText.getHeight()) / 2 - 2);
    }
});

export function getSSTransitions() {
    return totalLantern;
}