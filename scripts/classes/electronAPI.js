const API_NAME = 'electronAPI';

let InvokeBinds = {
    openFile: "dialog:openFile",
    readFirmwareArchive: "firmware:readArchive",
    minimizeWindow: "window:minimize",
    maximizeWindow: "window:maximize",
    closeWindow: "window:close",
    getAppVersion: "app:version",
    devTools: "window:devTools",
    updateApp: "app:update",
    checkForUpdates: "app:checkForUpdates",
    DEBUG: "app:DEBUG",
    readFile: "file:read"
}

class ElectronAPI {
    constructor(isPreload = false, contextBridge = null, ipcRenderer = null) {
        if (isPreload) {
            if (!contextBridge || !ipcRenderer) {
                throw new Error("Context bridge and IPC renderer must be provided in preload mode");
            }
            this._exposeToWorld(contextBridge, ipcRenderer);
        } else {
            if (window[API_NAME]) {
                console.log('ElectronAPI is available in the main world:', window[API_NAME]);
            } else {
                throw new Error("ElectronAPI is not available in the main world");
            }
        }
    }

    _exposeToWorld(contextBridge, ipcRenderer) {
        let functions = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        .filter(name => name !== 'constructor' && typeof this[name] === 'function' && !name.startsWith('_') && InvokeBinds[name] !== undefined)
        .map(name => ({
            name,
            params: this[name].toString().match(/\(([^)]*)\)/)[1].split(',').map(p => p.trim()).filter(p => p),
            invokeBind: InvokeBinds[name]
        }));
        console.log('ElectronAPI functions:', functions);

        let obj = {};
        functions.forEach(func => {
            obj[func.name] = (...args) => ipcRenderer.invoke(func.invokeBind, ...args);
        });

        contextBridge.exposeInMainWorld(API_NAME, obj);
    }

    openFile(filters, properties) {
        return window[API_NAME].openFile(filters, properties);
    }

    readFirmwareArchive(firmwarePath) {
        return window[API_NAME].readFirmwareArchive(firmwarePath);
    }

    minimizeWindow() {
        window[API_NAME].minimizeWindow();
    }

    maximizeWindow() {
        window[API_NAME].maximizeWindow();
    }

    closeWindow() {
        window[API_NAME].closeWindow();
    }

    getAppVersion() {
        return window[API_NAME].getAppVersion();
    }

    devTools() {
        window[API_NAME].devTools();
    }

    updateApp() {
        window[API_NAME].updateApp();
    }

    checkForUpdates() {
        return window[API_NAME].checkForUpdates();
    }

    DEBUG() {
        return window[API_NAME].DEBUG();
    }

    readFile(filePath) {
        return window[API_NAME].readFile(filePath);
    }
}

export default ElectronAPI;