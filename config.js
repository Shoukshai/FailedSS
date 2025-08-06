import Settings from "../Amaterasu/core/Settings"
import DefaultConfig from "../Amaterasu/core/DefaultConfig"

let version = "1.1.0";
try {
    version = JSON.parse(FileLib.read("FailedSS", "metadata.json")).version || "1.0.0";
} catch (e) {}

const CHANGELOG = "# §dFailedSS v" + version + "\n " + FileLib.read("FailedSS", "changelog.md");

const defaults = new DefaultConfig("FailedSS", "data/settings.json")

    // Category: General -> Subcategory: General
    .addSwitch({
        configName: "enabled",
        title: "Enabled",
        description: "Master toggle for the module.",
        category: "General",
        subcategory: "General",
        value: true
    })
    .addSwitch({
        configName: "enableArcher",
        title: "Only for Arch",
        description: "Enable the module only for archer.",
        category: "General",
        subcategory: "General",
        value: true
    })
    // Category: Archer Helper -> Subcategory: p3
    .addSwitch({
        configName: "archSafeSpot",
        title: "Alert to safe spot",
        description: "Make an alert when you have to safespot at pre-enter bcs healer failed SS",
        category: "Archer Helper",
        subcategory: "p3",
        value: false
    })
    .addSlider({
        configName: "archSafeSpotLength",
        title: "Length of the alert",
        description: "How long it will alert you for the safe spot",
        category: "Archer Helper",
        subcategory: "p3",
        options: [500, 5000],
        value: 1500
    })
    .addDropDown({
        configName: "archSafeSpotDetection",
        title: "Detection of failed SS",
        description: "Change the detection used between timer or sea lanterns numbers",
        category: "Archer Helper",
        subcategory: "p3",
        options: ["Sea lanterns", "Timer"]
    })
    .addSlider({
        configName: "archSafeSpotTimer",
        title: "Timer for safe spot",
        description: "Increase or decrease the time it takes to alert you for safe spot, it start when you drop down",
        category: "Archer Helper",
        subcategory: "p3",
        options: [5, 100],
        value: 35
    })
    .addSlider({
        configName: "archSafeSpotLanternsThreshold",
        title: "Threshold of lanterns",
        description: "How many lanterns can spawn before alerting you",
        category: "Archer Helper",
        subcategory: "p3",
        options: [1, 30],
        value: 15
    })

const config = new Settings("FailedSS", defaults, "data/ColorScheme.json", "FailedSS Settings")
    .addMarkdown("Changelog", CHANGELOG)
    .setCommand("failedss", ["ff"])
    .apply();

export default config.settings

