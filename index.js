// @ts-nocheck
import { eventSource, event_types } from "../../../../../script.js";

const extensionName = "Quota-Check";
const extensionFolderPath = `third-party/${extensionName}`;

const defaultSettings = {
    activate_setting: true,
};

let originalConsoleLog = console.log;
let originalConsoleWarn = console.warn;
let originalConsoleError = console.error;

function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
        saveSettingsDebounced();
    }

    $("#activate_setting").prop("checked", extension_settings[extensionName].activate_setting);
}

function checkForQuotaError(message) {
    if (typeof message === 'string' && message.includes("Out of quota")) {
        // 触发一个自定义事件来通知其他部分停止生成
        eventSource.emit("stop_generation");
        console.log("检测到 Out of quota，已触发停止生成事件");
    }
}

function overrideConsoleMethods() {
  console.log = function(...args) {
        args.forEach(checkForQuotaError);
        originalConsoleLog.apply(console, args);
    };

    console.warn = function(...args) {
        args.forEach(checkForQuotaError);
        originalConsoleWarn.apply(console, args);
    };

    console.error = function(...args) {
        args.forEach(checkForQuotaError);
        originalConsoleError.apply(console, args);
    };
}

function restoreConsoleMethods() {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
}

async function onExtensionToggle() {
    const isEnabled = Boolean($("#activate_setting").prop("checked"));
    extension_settings[extensionName].activate_setting = isEnabled;

    if (isEnabled) {
        overrideConsoleMethods();
    } else {
        restoreConsoleMethods();
    }
    saveSettingsDebounced();
}

$(document).ready(function () {
    loadSettings();
    $("#activate_setting").click(onExtensionToggle);
    if (extension_settings[extensionName]?.activate_setting) {
        overrideConsoleMethods();
    }
});
