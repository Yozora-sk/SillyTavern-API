// @ts-nocheck
import { eventSource, event_types, saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings, renderExtensionTemplateAsync } from "../../../../extensions.js";

const extensionName = "Quota-Check";
const extensionFolderPath = `third-party/${extensionName}`;

const defaultSettings = {
    activate_setting: true,
    stop_on_quota: true, // 新增设置：是否在 Out of quota 时停止
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

    // 更新 UI 状态
    $("#quota_check_activate_setting").prop("checked", extension_settings[extensionName].activate_setting);
    $("#stop_on_quota").prop("checked", extension_settings[extensionName].stop_on_quota);
}

function checkForQuotaError(message) {
    if (typeof message === 'string' && message.includes("Out of quota")) {
        if (extension_settings[extensionName].stop_on_quota) {
            eventSource.emit("stop_generation");
            console.log("检测到 Out of quota，已触发停止生成事件");
        }
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
    const isEnabled = Boolean($("#quota_check_activate_setting").prop("checked"));
    extension_settings[extensionName].activate_setting = isEnabled;

    if (isEnabled) {
        overrideConsoleMethods();
    } else {
        restoreConsoleMethods();
    }
    saveSettingsDebounced();
}

// 新增：处理设置更改的函数
async function onStopOnQuotaChange() {
    const stopOnQuota = Boolean($("#stop_on_quota").prop("checked"));
    extension_settings[extensionName].stop_on_quota = stopOnQuota;
    saveSettingsDebounced();
}


async function renderUI() {
    const ui = $(await renderExtensionTemplateAsync(extensionFolderPath, "ui"));

    // 设置复选框的初始状态, 监听change事件
    ui.find("#quota_check_activate_setting")
      .prop("checked", extension_settings[extensionName]?.activate_setting ?? defaultSettings.activate_setting)
      .on("change", onExtensionToggle);

    ui.find("#stop_on_quota")
      .prop("checked", extension_settings[extensionName]?.stop_on_quota ?? defaultSettings.stop_on_quota)
      .on("change", onStopOnQuotaChange);


    $("#extensions_settings").prepend(ui); //确保设置在顶上
}

$(document).ready(async function () {
    await renderUI();
    loadSettings();
    if (extension_settings[extensionName]?.activate_setting) {
        overrideConsoleMethods();
    }
});
