import Confirmation from "./modals/confirmationModal.js";
import CustomInputModal from "./modals/inputModal.js";

class Manager {
    /** @type {import("./main.js")["default"]["prototype"]} */
    main;    

    /** @type {import("./serialDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    connectingOverlay = document.createElement('div');

    modalOverlay = document.createElement('div');

    connectingContainer = document.createElement('div');

    errorDetails = document.createElement('span');

    connectingErrorCont = document.createElement('div');

    disconnectedContainer = document.createElement('div');

    exitLoop = false;

    allowSerialCom = false;

    connected = false;

    dataBuffer = [];

    _overlay = true;
    get overlay() {
        return this._overlay;
    }
    set overlay(value) {
        if (this._overlay === value) return;
        this._overlay = value;
        if (value) {
            this.connectingOverlay.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            this.connectingOverlay.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    _connecting = false;
    get connecting() {
        return this._connecting;
    }
    set connecting(value) {
        if (this._connecting === value) return;
        this._connecting = value;
        if (value && !this.disconnected) {
            this.connectingContainer.classList.remove('opacity-0', 'pointer-events-none');
            this.connectingError = null;
            this.connected = false;
            this.device.deviceElement.status = "connecting";
        } else {
            this.connectingContainer.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    _connectingError = null;
    get connectingError() {
        return this._connectingError;
    }
    set connectingError(value) {
        if (this._connectingError === value) return;
        this._connectingError = value;
        if (value != null && !this.disconnected) {
            this.connecting = false;
            this.errorDetails.innerText = value;
            this.connected = false;
            this.connectingErrorCont.classList.remove('opacity-0', 'pointer-events-none');
            this.device.deviceElement.status = "error";
        } else {
            this.errorDetails.innerText = "No further details are available";
            this.connectingErrorCont.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    _disconnected = false;
    get disconnected() {
        return this._disconnected;
    }
    set disconnected(value) {
        if (this._disconnected === value) return;
        this._disconnected = value;
        if (value) {
            this.overlay = true;
            this.connecting = false;
            this.connectingError = null;
            this.connected = false;
            this.device.deviceElement.status = "disconnected";
            this.disconnectedContainer.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            this.disconnectedContainer.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    /** @type {import("./modals/modal.js")["default"]["prototype"]} */
    _activeModal = null;
    get activeModal() {
        return this._activeModal;
    }

    /** @param {import("./modals/modal.js")["default"]["prototype"]} value */
    set activeModal(value) {
        if (this._activeModal === value || (this._activeModal != null && this._activeModal.locked)) return;
        if (this._activeModal != null) this._activeModal.onClose();
        this._activeModal = value;
        for (let i = 0; i < this.modalOverlay.children.length; i++) {
            const child = this.modalOverlay.children[i];
            child.classList.toggle('hidden', child !== value?.element);
        }
        if (value != null) value.element.classList.remove('hidden');
        this.modalOverlay.classList.toggle('opacity-0', value == null);
        this.modalOverlay.classList.toggle('pointer-events-none', value == null);
    }

    constructor(main, device) {
        this.main = main;
        this.device = device;
        this.element.classList.add('flex', 'flex-row', 'items-center', 'justify-center', 'h-full', 'w-full', "hidden", "bg-black/30", "backdrop-blur-xl", "rounded-lg", "overflow-auto", "hideScrolls");

        //Modal overlay
        this.modalOverlay.role = "Modal Overlay";
        this.modalOverlay.classList.add('absolute', 'z-10', 'bg-black/50', 'flex', 'items-center', 'justify-center', 'w-full', 'h-full', "transition", "duration-200", "ease-in-out", "opacity-0", "pointer-events-none", "backdrop-blur-sm");
        this._overlayPointerDown = false;
        this.modalOverlay.addEventListener('pointerdown', (e) => {
            this._overlayPointerDown = e.target === this.modalOverlay;
        });
        this.modalOverlay.addEventListener('pointerup', (e) => {
            if (this._overlayPointerDown && e.target === this.modalOverlay) {
                this.activeModal = null;
            }
            this._overlayPointerDown = false;
        });
        this.modalOverlay.addEventListener('pointercancel', () => {
            this._overlayPointerDown = false;
        });
        this.element.appendChild(this.modalOverlay);

        //Modals
        this.confirmation = new Confirmation(this);
        this.customInput = new CustomInputModal(this);

        //Connecting overlay items
        this.connectingOverlay.role = "Connecting Overlay";
        this.connectingOverlay.classList.add('absolute', 'z-20', 'bg-black/75', 'flex', 'items-center', 'justify-center', 'w-full', 'h-full', "transition", "duration-200", "ease-in-out", "backdrop-blur-md");


        //Connecting elements
        this.connectingContainer = document.createElement('div');
        this.connectingContainer.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'gap-4', "select-none", "opacity-0", "pointer-events-none", "absolute", "transition", "duration-200", "ease-in-out");
        var spinner = document.createElement('i');
        spinner.classList.add('fa-solid', 'fa-circle-notch', 'animate-spin', 'text-4xl');
        this.connectingContainer.appendChild(spinner);
        let connectingText = document.createElement('span');
        connectingText.classList.add('text-xl', "ml-2");
        connectingText.innerText = "Connecting to " + this.device.name + "...";
        this.connectingContainer.appendChild(connectingText);
        this.connectingOverlay.appendChild(this.connectingContainer);
        this.element.appendChild(this.connectingOverlay);


        //Connecting error elements
        this.connectingErrorCont = document.createElement('div');
        this.connectingErrorCont.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'gap-4', 'select-none', "opacity-0", "pointer-events-none", "absolute", "transition", "duration-200", "ease-in-out");
        var errorIcon = document.createElement('i');
        errorIcon.classList.add('fa-solid', 'fa-triangle-exclamation', 'text-4xl', 'text-white');
        this.connectingErrorCont.appendChild(errorIcon);
        var errorText = document.createElement('span');
        errorText.classList.add('text-xl', 'text-white', "text-center", "px-6");
        errorText.innerText = "Something went wrong trying to connect to " + this.device.name;
        this.connectingErrorCont.appendChild(errorText);
        this.errorDetails = document.createElement('span');
        this.errorDetails.classList.add('text-sm', 'text-white/75');
        this.errorDetails.innerText = "No further details are available";
        this.connectingErrorCont.appendChild(this.errorDetails);
        var retryButton = document.createElement('button');
        retryButton.classList.add('px-4', 'py-2', 'bg-yellow-500', 'text-white', 'rounded', 'hover:bg-yellow-600', 'active:bg-yellow-700', 'cursor-pointer');
        retryButton.innerText = "Retry";
        retryButton.addEventListener('click', () => {
            this.connect();
        });
        this.connectingErrorCont.appendChild(retryButton);
        this.connectingOverlay.appendChild(this.connectingErrorCont);


        //Disconnected elements
        this.disconnectedContainer.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'gap-4', 'select-none', "opacity-0", "pointer-events-none", "absolute", "transition", "duration-200", "ease-in-out");
        var disconnectIcon = document.createElement('i');
        disconnectIcon.classList.add('fa-solid', 'fa-plug-circle-minus', 'text-4xl', 'text-white');
        this.disconnectedContainer.appendChild(disconnectIcon);
        var disconnectText = document.createElement('span');
        disconnectText.classList.add('text-2xl', 'text-white');
        disconnectText.innerText = this.device.name + " has been disconnected";
        this.disconnectedContainer.appendChild(disconnectText);
        this.connectingOverlay.appendChild(this.disconnectedContainer);

        this.main.contentContainerElement.appendChild(this.element);
    }

    async onSwitch() {
        console.log('Switched to device:', this.device.name);
    }

    async startReaderLoop () {
        while (this.device.port.readable && !this.exitLoop) {
            const reader = this.device.port.readable.getReader();
            try {
                while (true && !this.exitLoop) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    let data = this.dataBuffer;
                    value.forEach(byte => {
                        data.push(byte);
                        // If line starts with [SC], it's a socket-com message and we should only check for \r\n after the prefix
                        if (this.allowSerialCom && data[0] == 91 && data[1] == 83 && data[2] == 67 && data[3] == 93) {
                            // 13 is the ASCII code for \r, 10 is the ASCII code for \n
                            if (byte === 10 && data[data.length - 2] === 13) this.handleLine(data.splice(0, data.length-2));
                        } else if (byte === 10) this.handleLine(data.splice(0, data.length));
                    });
                }
            } catch (error) {
                console.error('Error in reader loop:', error, this.device);
            } finally {
                reader.releaseLock();
            }
        }
    }

    /**
     * @param {Array<number>} line 
     */
    handleLine(line) {
        const output = String.fromCharCode(...line);
        this.element.dispatchEvent(new CustomEvent('console-output', { detail: output }));
        this.dataBuffer = [];
    }

    async sendCommand (command) {
        if (!this.device.port.writable) {
            console.error('Port is not writable, cannot send command:', command);
            return false;
        }
        const writer = this.device.port.writable.getWriter();
        try {
            const encoder = new TextEncoder();
            console.log('Sending command to port:', command);
            await writer.write(encoder.encode(command + "\n"));
        } catch (error) {
            console.error('Error writing to port:', error);
            return false;
        } finally {
            try {
                writer.releaseLock();
            } catch (error) {
                console.error('Error releasing writer lock:', error);
            }
        }
        return true;
    }

    async connect () {
        console.log('Opening port to:', this.device.name);
        this.exitLoop = false;
        this.connecting = true;
        try {
            await this.device.port.open({baudRate: 115200});
        } catch (error) {
            this.connectingError = error.message;
            console.error('Failed to open port:', error);
            return;
        }
        this.startReaderLoop();
    }
}

export default Manager;