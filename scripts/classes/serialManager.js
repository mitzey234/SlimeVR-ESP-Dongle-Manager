import Manager from "./manager.js";
import Terminal from "./terminal.js";
import SerialContainer from "./serialContainer.js";
import { ESPLoader } from "../esptool.js";
import parseFlashSize from "./parseFlashSize.js";
import CustomFirmwareFlashModal from "./modals/customFirmwareFlashModal.js";
import DongleFirmwareFlashModal from "./modals/dongleFirmwareFlashModal.js";

class SerialManager extends Manager {

    connectOverlay = document.createElement('div');

    _esploaderConnected = false;
    get esploaderConnected() {
        return this._esploaderConnected;
    }

    set esploaderConnected(value) {
        if (this._esploaderConnected === value) return;
        this._esploaderConnected = value;
        if (this.device.port.connected) {
            this.overlay = false;
            this.connecting = false;
            this.device.deviceElement.status = "connected";
        }
        this.terminal.input.disabled = value;
        //Show esploader related buttons
        this.serialContainer.connectESPTool.classList.toggle('hidden', value);
        this.serialContainer.returnToFirmware.classList.toggle('hidden', !value);
        this.serialContainer.eraseFlashButton.classList.toggle('hidden', !value);
        this.serialContainer.customFirmwareButton.classList.toggle('hidden', !value);
        this.serialContainer.dongleFirmwareButton.classList.toggle('hidden', !value);
    }

    constructor(main, device) {
        super(main, device);

        //Connect error elements
        this.connectOverlay = document.createElement('div');
        this.connectOverlay.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'gap-4', 'select-none', "absolute", "transition", "duration-200", "ease-in-out");
        var connectIcon = document.createElement('i');
        connectIcon.classList.add('fa-solid', 'fa-plug', 'text-4xl', 'text-white');
        this.connectOverlay.appendChild(connectIcon);
        var connectButton = document.createElement('button');
        connectButton.classList.add('px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-600', 'active:bg-blue-700', 'cursor-pointer', "mt-4");
        connectButton.innerText = "Connect to port";
        connectButton.addEventListener('click', () => {
            this.connect();
            this.connectOverlay.classList.add('opacity-0', 'pointer-events-none');
        });
        this.connectOverlay.appendChild(connectButton);
        this.connectingOverlay.appendChild(this.connectOverlay);

        this.serialContainer = new SerialContainer(this, device);

        this.terminal = new Terminal(this, device);
        this.terminal.element.classList.remove('w-full');
        this.terminal.element.classList.add('w-1/2');

        this.dongleFirmwareModal = new DongleFirmwareFlashModal(this);
        this.customFirmwareModal = new CustomFirmwareFlashModal(this);
    }

    onSwitch () {
        //Scroll terminal to bottom when switching to it
        if (this.scrollToBottomOnSwitchAway) {
            this.terminal.messageContainer.scrollTop = this.terminal.messageContainer.scrollHeight;
            this.scrollToBottomOnSwitchAway = false;
        }
    }

    onSwitchAway () {
        super.onSwitchAway();
        if (this.terminal.scrolledToBottom) this.scrollToBottomOnSwitchAway = true;
    }

    async connect () {
        let result = await super.connect();
        if (!result) return;
        this.connecting = false;
        this.overlay = false;
        this.device.deviceElement.status = "connected";
    }

    /**
     * @param {Array<number>} line 
     */
    handleLine(line) {
        const output = String.fromCharCode(...line);
        this.terminal.addMessage(output);
        this.element.dispatchEvent(new CustomEvent('console-output', { detail: output }));
        this.dataBuffer = [];
    }

    async connectESPTool () {
        this.exitLoop = true; // Stop any ongoing loops
        this.reader.releaseLock(); // Release the reader lock if held

        this.connecting = true;
        this.overlay = true;

        let esploader = new ESPLoader(this.device.port, {
            log: (...args) => console.log(...args),
            debug: (...args) => console.debug(...args),
            error: (...args) => console.error(...args),
        });

        this.esploader = esploader;

        await esploader.hardResetClassic();
        await esploader.hardResetClassic();

        try {
            await esploader.initialize();
        } catch (err) {
            try {
                await esploader.disconnect();
                await this.device.port.open({ baudRate: 115200 });
            } catch (disconnectErr) {
                // Ignore disconnect errors
                console.error('Failed to disconnect after failed ESPTool connection:', disconnectErr);
            }
            this.exitLoop = false;
            this.connecting = false;
            this.overlay = false;
            this.terminal.addMessage("Failed to connect to ESPTool. Make sure your device is in bootloader mode and try again. Otherwise this device might not be compatible with the ESPTool-based flasher\nError details:\n" + err.message);
            console.error('Failed to connect ESPTool:', err);
            this.startReaderLoop();
            this.device.deviceElement.status = "connected";
            return;
        }
        this.exitLoop = false;
        this.device.name = esploader.chipName;
        this.connectingText.innerText = "Connecting to " + this.device.name + "...";
        try {
            this.serialContainer.macAddress = await esploader.getMacAddress();
         } catch (err) {
            console.error('Failed to get MAC address:', err);
        }

        let info = this.device.port.getInfo();

        const e = this.esploader.detectUSBSerialChip(info.usbVendorId, info.usbProductId);
        if (e) this.device.deviceElement.subtext1 = e.name;

        this.espStub = await esploader.runStub();

        // Set detected flash size in the read size field
        if (this.espStub.flashSize) {
            const flashSizeBytes = parseFlashSize(this.espStub.flashSize);
            console.log(`Detected flash size: ${this.espStub.flashSize} (${flashSizeBytes} bytes)`);
        }
        this.esploaderConnected = true;

        this.serialContainer.dongleFirmwareButton.classList.toggle('hidden', !(this.esploader.chipName === "ESP32-S2" || this.esploader.chipName === "ESP32-S3"));

        console.log(this.espStub.getBootloaderOffset());
    }

    async returnToFirmware () {
        if (this.esploader && this.esploaderConnected) {
            this.connecting = true;
            this.overlay = true;
            try {
                await this.espStub.enterConsoleMode();
                await this.esploader.disconnect();
                this.espStub = null;
                this.esploaderConnected = false;
                this.connect();
            } catch (disconnectErr) {
                // Ignore disconnect errors
            }
        }
    }

    async disconnect () {
        if (this.esploaderConnected) {
            this.waiting.waiting("Disconnecting", "Please wait while we disconnect from the device", true, false);
            await this.espStub.enterConsoleMode();
            await this.esploader.disconnect();
            await this.esploader.disconnect();
            this.esploaderConnected = false;
            this.waiting.complete();
        }
        super.disconnect();
        this.connectOverlay.classList.remove('opacity-0', 'pointer-events-none');
    }

    async eraseFlash () {
        if (!this.espStub) return;
        this.waiting.waiting("Erasing flash...", "This may take a while, please wait", true, false);
        let stamp = Date.now();
        await this.espStub.eraseFlash();
        console.log("Finished. Took " + (Date.now() - stamp) + "ms to erase.");
        this.waiting.complete();
    }
}

export default SerialManager;