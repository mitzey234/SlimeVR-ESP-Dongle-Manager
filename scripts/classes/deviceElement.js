class DeviceElement {
    /** @type {import("./serialDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    statusContainer = document.createElement('span');

    pingElement = document.createElement('span');

    statusElement = document.createElement('span');

    nameElement = document.createElement('span');

    subtextElement1 = document.createElement('span');

    subtextElement2 = document.createElement('span');

    get flashing() {
        return !this.pingElement.classList.contains('hidden');
    }
    set flashing (value) {
        this.pingElement.classList.toggle('hidden', !value);
    }

    set status (value) {
        this.statusElement.classList.toggle('bg-green-500', value === "connected");
        this.pingElement.classList.toggle('bg-green-400', value === "connected");
        this.statusElement.classList.toggle('bg-yellow-500', value === "connecting");
        this.pingElement.classList.toggle('bg-yellow-400', value === "connecting");
        this.statusElement.classList.toggle('bg-red-500', value === "error");
        this.pingElement.classList.toggle('bg-blue-400', value === "pairing");
        this.statusElement.classList.toggle('bg-blue-500', value === "pairing");
        this.pingElement.classList.toggle('bg-purple-400', value === "scanning environment");
        this.statusElement.classList.toggle('bg-purple-500', value === "scanning environment");
        this.flashing = value !== "error" && value !== "connected";
        this.statusContainer.classList.toggle('hidden', value === "disconnected");
        this.statusContainer.title = value.charAt(0).toUpperCase() + value.slice(1);
    }

    get subtext1() {
        return this.subtextElement1.innerText.trim() === "" ? null : this.subtextElement1.innerText;
    }

    set subtext1(value) {
        if (value === this.subtext1) return;
        this.subtextElement1.innerText = value;
        if (value == null) this.subtextElement1.classList.add('hidden');
        else this.subtextElement1.classList.remove('hidden');
    }

    get subtext2() {
        return this.subtextElement2.innerText.trim() === "" ? null : this.subtextElement2.innerText;
    }

    set subtext2(value) {
        if (value === this.subtext2) return;
        this.subtextElement2.innerText = value;
        if (value == null) this.subtextElement2.classList.add('hidden');
        else this.subtextElement2.classList.remove('hidden');
    }
    
    constructor(device) {
        this.device = device;
        this.element.classList.add('relative', 'h-full', 'w-42', 'hover:bg-black/20', 'active:bg-black/40', 'flex', 'flex-col', 'items-center', 'justify-center', 'cursor-pointer', "select-none", "transition", "duration-200", "ease-in-out", "shrink-0");
        let icon = document.createElement('i');
        icon.classList.add('fas', 'fa-microchip', 'text-4xl');
        let slimeIcon = document.createElement('img');
        slimeIcon.setAttribute('draggable', 'false');
        slimeIcon.src = "slime_icon.svg";
        this.nameElement.classList.add('text-sm', 'mt-2', "truncate");
        this.nameElement.innerText = device.name;

        this.subtextElement1.classList.add('text-xs', 'text-white/50', 'truncate');
        this.subtextElement2.classList.add('text-xs', 'text-white/50', 'truncate');

        if (this.device.constructor.name === "ProtonDongleDevice") this.element.appendChild(slimeIcon);
        else {
            if (this.device.constructor.name === "UnknownDevice") {
                icon.classList.replace('fa-microchip', 'fa-question');
                if (!this.device.main.showHiddenDevices) this.element.classList.add('hidden');
            }
            this.element.appendChild(icon);
            let deviceInfo = this.device.port.getInfo();
            if (deviceInfo.usbVendorId && deviceInfo.usbProductId) {
                this.subtext1 = "VID: " + deviceInfo.usbVendorId.toString(16).padStart(4, '0') + " PID: " + deviceInfo.usbProductId.toString(16).padStart(4, '0');
            }
        }

        this.statusContainer.classList.add('absolute', 'flex', 'size-4', 'top-4', 'right-4');
        this.statusElement.classList.add('relative', 'size-4', 'rounded-full', 'bg-green-500', 'transition', 'duration-200', 'ease-in-out');
        this.pingElement.classList.add('hidden', 'absolute', 'h-full', 'w-full', 'animate-ping', 'rounded-full', 'bg-green-400', 'opacity-75');
        this.statusContainer.appendChild(this.pingElement);
        this.statusContainer.appendChild(this.statusElement);
        this.element.appendChild(this.statusContainer);
        this.flashing = false;
        this.status = "disconnected";

        this.element.appendChild(this.nameElement);
        this.element.appendChild(this.subtextElement1);
        this.element.appendChild(this.subtextElement2);
        
        this.element.addEventListener('click', () => {
            this.device.main.currentDevice = this.device;
        });
    }
}

export default DeviceElement;