import Manager from "./manager.js";
import Terminal from "./terminal.js";
import SerialContainer from "./serialContainer.js";
import { ESPLoader } from "../esptool.js";
import parseFlashSize from "./parseFlashSize.js";

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
    }

    onSwitch () {

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
            // Not ESP32-S2 or other error
            try {
                await esploader.disconnect();
            } catch (disconnectErr) {
                // Ignore disconnect errors
            }
            this.exitLoop = false;
            this.connecting = false;
            this.overlay = false;
            this.connectOverlay.classList.remove('opacity-0', 'pointer-events-none');
            console.error('Failed to connect ESPTool:', err);
            this.startReaderLoop();
            this.device.deviceElement.status = "connected";
            return;
        }
        this.exitLoop = false;
        this.device.name = esploader.chipName;
        try {
            this.serialContainer.macAddress = await esploader.getMacAddress();
         } catch (err) {
            console.error('Failed to get MAC address:', err);
        }

        this.espStub = await esploader.runStub();

        // Set detected flash size in the read size field
        if (this.espStub.flashSize) {
            const flashSizeBytes = parseFlashSize(this.espStub.flashSize);
            console.log(`Detected flash size: ${this.espStub.flashSize} (${flashSizeBytes} bytes)`);
        }
        this.esploaderConnected = true;
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
}

export default SerialManager;