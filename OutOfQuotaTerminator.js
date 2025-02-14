// OutOfQuotaTerminator.plugin.js
// 将此文件放置在SillyTavern的插件目录中

const baseObject = {
    name: 'OutOfQuota Terminator',
    description: '自动检测API配额耗尽错误并终止回复',
    version: '1.0.0',
    author: 'Your Name'
};

let originalConsoleError;
let isMonitoring = false;
let currentRequestController = null;

function initialize() {
    // 保存原始控制台错误方法
    originalConsoleError = console.error;

    // 劫持控制台错误输出
    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        checkForQuotaError(args);
    };

    // 劫持fetch API以获取请求控制器
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const controller = new AbortController();
        if (init) {
            init.signal = controller.signal;
        } else {
            init = { signal: controller.signal };
        }
        currentRequestController = controller;
        return originalFetch(input, init);
    };

    console.log(`${baseObject.name} 插件已加载`);
}

function checkForQuotaError(args) {
    const errorMessage = args.join(' ');
    if (errorMessage.includes('Out of quota') || 
        errorMessage.includes('API quota exceeded') || 
        errorMessage.includes('429')) {
        console.warn('检测到API配额错误，正在终止当前请求...');
        
        // 中止当前请求
        if (currentRequestController) {
            currentRequestController.abort();
            currentRequestController = null;
        }
        
        // 清除正在生成的回复
        if (typeof window?.cancelReply === 'function') {
            window.cancelReply();
        }
        
        // 显示用户提示
        toast('API配额已用尽，请稍后再试或更换API密钥');
    }
}

function toast(message, duration = 3000) {
    const toastElement = document.createElement('div');
    toastElement.style.position = 'fixed';
    toastElement.style.bottom = '20px';
    toastElement.style.right = '20px';
    toastElement.style.padding = '10px';
    toastElement.style.background = '#ff4444';
    toastElement.style.color = 'white';
    toastElement.style.borderRadius = '5px';
    toastElement.textContent = message;
    document.body.appendChild(toastElement);

    setTimeout(() => {
        document.body.removeChild(toastElement);
    }, duration);
}

// 插件生命周期钩子
const pluginObject = {
    ...baseObject,
    
    onLoad: function() {
        initialize();
        isMonitoring = true;
    },
    
    onUnload: function() {
        console.log = originalConsoleError;
        isMonitoring = false;
        currentRequestController = null;
    }
};

// 注册插件
if (typeof window.registerPlugin !== 'undefined') {
    window.registerPlugin(pluginObject);
} else {
    console.error('SillyTavern插件系统未找到');
}