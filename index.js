// @ts-nocheck
import { eventSource, event_types, saveSettingsDebounced, extension_settings } from "../../../../../script.js";

const extensionName = "JS-Slash-Runner-Quota-Check";
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


async function renderSettings() {
    const settingsHtml = $(`
        <div class="js_slash_runner_quota_check_settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>JS Slash Runner Quota Check</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="flex-container">
                        <label for="activate_setting">启用扩展:</label>
                        <input id="activate_setting" type="checkbox" >
                    </div>
                </div>
            </div>
        </div>
    `);

    $("#extensions_settings").append(settingsHtml);

    $("#activate_setting").on("click", onExtensionToggle);
   
    loadSettings();
}

$(document).ready(function () {
    renderSettings();  // 渲染设置界面
     if (extension_settings[extensionName]?.activate_setting) {
        overrideConsoleMethods();
    }
});

