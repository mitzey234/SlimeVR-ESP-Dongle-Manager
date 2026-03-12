import ElectronAPI from "./electronAPI.js";
import { ESPLoader } from "../esptool.js";
import SerialDevice from "./serialDevice.js";
import ESP32Device from "./esp32Device.js";
import ProtonDongleDevice from "./protonDongleDevice.js";
import UnknownDevice from "./unknownDevice.js";``

let minimizeBtn = document.getElementById('minimize-btn');
let maximizeBtn = document.getElementById('maximize-btn');
let closeBtn = document.getElementById('close-btn');
let devToolsBtn = document.getElementById('devTools-btn');
let refreshBtn = document.getElementById('refresh-btn');
let updateBtn = document.getElementById('update-btn');
let pageTitle = document.getElementById('pageTitle');
let appTitle = document.getElementById('appTitle');
let overlay = document.getElementById('overlay');
let hiddenDeviceCount = document.getElementById('hiddenDeviceCount');
let showHiddenDevicesBtn = document.getElementById('showHiddenDevices');
let hiddenDevicesToggle = document.getElementById('hiddenDevicesToggle');
let noDeviceSelectedContent = document.getElementById('noDeviceSelectedContent');

refreshBtn.addEventListener('click', () => {
    location.reload();
});

class Main {
    /** @type {Array<{res: Function, rej: Function}>} */
    hooks = [];

    /** @type {Map<string, import("./serialDevice.js")["default"]["prototype"]>} */
    serialDevices = new Map();

    /** @type {import("../esptool.js")} */
    esptoolPackage;

    /** @type {ElectronAPI} */
    electronAPI;

    consolePrefix = "[SC]";

    /** @type {null | {mac: string, tag: string, board: string, firmware: object | undefined}} */
    pendingFirmwareUpdate;

    /** @type {SerialDevice} */
    _currentDevice = null;

    //Tells the manager to automatically open the next dongle that connects, used for firmware updates. Will be set to false after 10 seconds to prevent accidentally opening random devices
    autoOpen = false;

    deviceContainerElement = document.getElementById('deviceSelector');

    contentContainerElement = document.getElementById('contentContainer');

    updateInterval = setInterval(this.checkForUpdates.bind(this), 10 * 60 * 1000); //Check for updates every 10 minutes
    
    get currentDevice () {
        return this._currentDevice;
    }

    /**
     * @param {SerialDevice} device
     */
    set currentDevice (device) {
        if (this._currentDevice === device) return;
        if (this._currentDevice != null) {
            if (!this._currentDevice.manager.device.port.connected) {
                console.log('Removing device from list:', this._currentDevice.name);
                this._currentDevice.manager.element.remove();
            } else {
                this._currentDevice.manager.onSwitchAway();
            }
            this._currentDevice.active = false;
        }
        this._currentDevice = device;
        if (device != null) {
            device.active = true;
            device.manager.onSwitch();
        }
        this.updatePageTitle();
        if (device) {
            noDeviceSelectedContent.classList.add('opacity-0', 'pointer-events-none');
        } else {
            noDeviceSelectedContent.classList.remove('opacity-0', 'pointer-events-none');
        }
    }

    set pageTitle(title) {
        pageTitle.innerText = title + " - " + (this.currentDevice ? this.currentDevice.name : "No Device");
        appTitle.innerText = title + " - " + (this.currentDevice ? this.currentDevice.name : "No Device");
    }

    get pageTitle() {
        return pageTitle.innerText;
    }

    set hiddenDeviceCount(count) {
        if (count > 0) {
            hiddenDeviceCount.innerText = count;
            showHiddenDevicesBtn.classList.remove('hidden');
        } else {
            hiddenDeviceCount.innerText = "";
            showHiddenDevicesBtn.classList.add('hidden');
        }
    }

    _showHiddenDevices = false;
    get showHiddenDevices() {
        return this._showHiddenDevices;
    }

    set showHiddenDevices(value) {
        if (this._showHiddenDevices === value) return;
        this._showHiddenDevices = value;
        this.serialDevices.forEach(device => {
            if (device.constructor.name === "UnknownDevice") {
                if (value) device.element.classList.remove('hidden');
                else device.element.classList.add('hidden');
            }
        });
        this.updateDeviceListPrompt();
        if (value) {
            hiddenDevicesToggle.children[0].classList.replace('fa-angle-right', 'fa-angle-left');
            hiddenDevicesToggle.title = "Hide hidden devices";
        } else {
            hiddenDevicesToggle.children[0].classList.replace('fa-angle-left', 'fa-angle-right');
            hiddenDevicesToggle.title = "Show hidden devices";
        }
    }

    _firmwareVersion = null;
    get firmwareVersion() {
        return this._firmwareVersion;
    }

    set firmwareVersion(value) {
        if (this._firmwareVersion === value) return;
        this._firmwareVersion = value;
        this.serialDevices.forEach(device => {
            if (device.constructor.name === "ProtonDongleDevice") device.manager.dongleContainer.checkUpdateIcon();
        });
    }

    constructor() {
        this.start();
    }

    async checkForUpdates() {
        this.updates = await this.electronAPI.checkForUpdates();
        if (this.updates != null) {
            if (this.updates.message != null) console.error('Error checking for updates:', this.updates.message);
            else {
                console.log('Update information:', this.updates);
                updateBtn.classList.remove('hidden');
                updateBtn.title = `Version ${this.updates.name} is available. Click to install`;
            }
        } else {
            console.log('No updates available');
        }
    }

    async start () {
        this.electronAPI = new ElectronAPI();
        this.checkForUpdates();
        minimizeBtn.addEventListener('click', () => {
            this.electronAPI.minimizeWindow();
        });
        maximizeBtn.addEventListener('click', () => {
            this.electronAPI.maximizeWindow();
        });
        closeBtn.addEventListener('click', () => {
            this.electronAPI.closeWindow();
        });
        devToolsBtn.addEventListener('click', () => {
            this.electronAPI.devTools();
        });
        updateBtn.addEventListener('click', () => {
            this.electronAPI.updateApp();
        });
        showHiddenDevicesBtn.addEventListener('click', () => {
            this.showHiddenDevices = !this.showHiddenDevices;
        });
        hiddenDevicesToggle.addEventListener('click', () => {
            this.showHiddenDevices = !this.showHiddenDevices;
        });
        if (await this.electronAPI.DEBUG()) {
            devToolsBtn.classList.remove('hidden');
            refreshBtn.classList.remove('hidden');
            //updateBtn.classList.remove('hidden');
        } else {
            devToolsBtn.remove();
            refreshBtn.remove();
        }
        this.pageTitle = `SlimeVR Dongle Manager v${await this.electronAPI.getAppVersion()}`;
        let result = await this.electronAPI.checkForFirmwareUpdates();
        if (result.error) console.error('Error checking for firmware updates:', result.error);
        else if (result.tag) {
            this.firmwareVersion = result.tag;
            console.log('Latest firmware version:', this.firmwareVersion);
        }
        window.navigator.serial.addEventListener('connect', this.onDeviceConnected.bind(this));
        let ports = await window.navigator.serial.getPorts();
        await this.sleep(500); //Give the UI some time to load before processing ports
        ports.forEach(port => {
            this.onDeviceConnected({ target: port });
        });
        this.hooks.forEach(hook => hook.res());
        this.hooks = [];
    }

    waitForReady() {
        let promObject = {res: null, rej: null};
        let promise = new Promise((res, rej) => {
            promObject.res = res;
            promObject.rej = rej;
        });
        this.hooks.push(promObject);
        return promise;
    }

    onDeviceConnected(event) {
        let port = event.target;
        if (!port.connected) return;
        let portInfo = port.getInfo();
        if (portInfo.usbVendorId == 4617 && portInfo.usbProductId == 30352) {
            //If running SlimeVR Dongle Firmware, vendor ID should be 4617 (0x1209) and product ID should be 30352 (0x76c8)
            console.log('SlimeVR Dongle detected');
            let device = new ProtonDongleDevice(this, port);
            if (this.autoOpen) {
                this.autoOpen = false;
                this.currentDevice = device;
            }
        } else if (portInfo.usbVendorId == 12346 && portInfo.usbProductId == 4097) {
            //If ESP in download mode, vendor ID should be 12346 (0x303a) and product ID should be 4097 (0x1001)
            console.log('ESP device in download mode detected');
            let device = new ESP32Device(this, port);
            if (this.pendingFirmwareUpdate != null) this.tryDeviceForUpdate(device);
        } else {
            console.log('Unknown serial device detected:', portInfo);
            new UnknownDevice(this, port);
        }
    }

    /**
     * @param {ESP32Device} device 
     */
    async tryDeviceForUpdate (device) {
        try {
            await device.manager.connect();
            await device.manager.connectESPTool();
            if (device.manager.serialContainer.macAddress == this.pendingFirmwareUpdate.mac) {
                console.log('Device matches pending firmware update, starting update process');
                let pending = this.pendingFirmwareUpdate;
                this.pendingFirmwareUpdate = null;
                this.currentDevice = device;
                let firmware = pending.firmware != null ? pending.firmware : await this.electronAPI.getFirmwareArchive(pending.tag, pending.board);
                if (typeof firmware === 'number') {
                    console.error('Error getting firmware archive:', firmware);
                    return;
                }
                device.manager.customFirmwareModal.open();
                device.manager.customFirmwareModal.flashType = 1;
                device.manager.customFirmwareModal.firmware = firmware;
                await device.manager.customFirmwareModal.flash();
                this.setAutoOpen();
            } else {
                console.log('Device does not match pending firmware update, disconnecting');
            }
        } catch (err) {
            console.error('Error during firmware update process:', err);
        } finally {
            await device.manager.disconnect();
        }
    }

    autoOpenTimeout;

    setAutoOpen() {
        this.autoOpen = true;
        clearTimeout(this.autoOpenTimeout);
        this.autoOpenTimeout = setTimeout(() => {
            this.autoOpen = false;
        }, 10000);
    }

    formatMacAddr(mac) {
        if (!this.esptoolPackage) {
            throw new Error("ESPLoader module not loaded");
        }
        return this.esptoolPackage.formatMacAddr(mac);
    }

    parseFlashSize(sizeStr) {
        if (!sizeStr || typeof sizeStr !== 'string') {
            return 0;
        }
        
        // Extract number and unit
        const match = sizeStr.match(/^(\d+)(KB|MB)$/i);
        if (!match) {
            // If no unit, assume it's already in MB (legacy behavior)
            const num = parseInt(sizeStr);
            return isNaN(num) ? 0 : num * 1024 * 1024;
        }
        
        const value = parseInt(match[1]);
        const unit = match[2].toUpperCase();
        
        if (unit === 'KB') {
            return value * 1024; // KB to bytes
        } else if (unit === 'MB') {
            return value * 1024 * 1024; // MB to bytes
        }
        
        return 0;
    }

    sleep (t = 100) {
        return new Promise((e) => setTimeout(e, t));
    }

    updateHiddenDeviceCount() {
        let count = 0;
        this.serialDevices.forEach(device => {
            if (device.constructor.name === "UnknownDevice") count++;
        });
        this.hiddenDeviceCount = count;
    }

    updateDeviceListPrompt() {
        let count = 0;
        let hidden = 0;
        this.serialDevices.forEach(device => {
            if (device.constructor.name === "UnknownDevice") hidden++;
        });

        for (let i = 0; i < this.deviceContainerElement.children.length; i++) {
            let child = this.deviceContainerElement.children[i];
            if (child.id == "noDevice") continue;
            if (child.id == "hiddenDevicesToggle") continue;
            if (child.classList.contains('hidden')) continue;
            count++;
        }

        if (count > 0) {
            document.getElementById('noDevice').classList.add('opacity-0', 'pointer-events-none');
            if (hidden > 0) hiddenDevicesToggle.classList.remove('hidden');
            else hiddenDevicesToggle.classList.add('hidden');
        } else {
            document.getElementById('noDevice').classList.remove('opacity-0', 'pointer-events-none');
            hiddenDevicesToggle.classList.add('hidden');
        }
    }

    async updatePageTitle() {
        this.pageTitle = `SlimeVR Dongle Manager v${await this.electronAPI.getAppVersion()}`;
    }
    
    sortDevices() {
        let dongles = [];
        let espDevices = [];
        let unknowns = [];
        this.serialDevices.forEach(device => {
            if (device.constructor.name === "ProtonDongleDevice") {
                dongles.push(device);
            } else if (device.constructor.name === "ESP32Device") {
                espDevices.push(device);
            } else {
                unknowns.push(device);
            }
        });
        let sortedDevices = [...dongles, ...espDevices, ...unknowns];
        // Update the DOM order based on sortedDevices
        sortedDevices.forEach((device, index) => {
            device.element.style.order = index;
        });
        hiddenDevicesToggle.style.order = sortedDevices.length;
    }
}

export default Main;