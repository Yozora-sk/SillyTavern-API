import { eventSource, event_types, stopGeneration } from '../../../script.js';
import { extension_settings, renderExtensionTemplateAsync } from '../../extensions.js';
import { t } from '../../i18n.js';

/**
 * Checks the console output for "Out of quota" and stops generation if found.
 */
function checkConsoleOutput() {
    const consoleOriginalError = console.error;

    console.error = function (...args) {
        const message = args.join(' ');
        if (message.toLowerCase().includes('out of quota')) {
            console.warn('Out of quota detected. Stopping generation.');
            stopGeneration();
            toastr.error(t`Out of quota detected. Generation stopped.`);
        }
        consoleOriginalError.apply(console, args);
    };
}

jQuery(async () => {
    // Manually disable the extension since static imports auto-import the JS file
    if (extension_settings.disabledExtensions.includes('quota_check')) {
        return;
    }

    const settingsHtml = $(await renderExtensionTemplateAsync('quota_check', 'dropdown'));
    $('#quota_check_container').append(settingsHtml); //注意这里的ID，需要和manifest中的js文件名匹配

    checkConsoleOutput();

    // Add a listener for streaming start, so we can re-hook console.error
    eventSource.on(event_types.STREAMING_STARTED, checkConsoleOutput);
});

