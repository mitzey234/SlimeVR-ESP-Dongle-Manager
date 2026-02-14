class DeviceElement {
    /** @type {import("./serialDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    statusContainer = document.createElement('span');

    pingElement = document.createElement('span');

    statusElement = document.createElement('span');

    set flashing (value) {
        this.pingElement.classList.toggle('hidden', !value);
    }

    set status (value) {
        this.statusElement.classList.toggle('bg-green-500', value === "connected");
        this.statusElement.classList.toggle('bg-yellow-500', value === "connecting");
        this.statusContainer.classList.toggle('hidden', value === "disconnected");
        this.statusContainer.title = value.charAt(0).toUpperCase() + value.slice(1);
    }

    constructor(device) {
        this.device = device;
        this.element.classList.add('relative', 'h-full', 'w-36', 'hover:bg-black/20', 'active:bg-black/40', 'flex', 'flex-col', 'items-center', 'justify-center', 'cursor-pointer', "select-none", "transition", "duration-200", "ease-in-out", "shrink-0");
        let icon = document.createElement('i');
        icon.classList.add('fas', 'fa-microchip', 'text-4xl');
        let slimeIcon = document.createElement('img');
        slimeIcon.setAttribute('draggable', 'false');
        slimeIcon.src = "slime_icon.svg";
        let name = document.createElement('span');
        name.classList.add('text-sm', 'mt-2');
        name.innerText = device.name;
        let ids;
        if (this.device.constructor.name === "ProtonDongleDevice") this.element.appendChild(slimeIcon);
        else {
            if (this.device.constructor.name === "UnknownDevice") {
                icon.classList.replace('fa-microchip', 'fa-question');
                if (!this.device.main.showHiddenDevices) this.element.classList.add('hidden');
            }
            this.element.appendChild(icon);
            ids = document.createElement('span');
            let deviceInfo = this.device.port.getInfo();
            if (deviceInfo.usbVendorId && deviceInfo.usbProductId) {
                ids.classList.add('text-xs', 'text-white/50');
                ids.innerText = "VID: " + deviceInfo.usbVendorId.toString(16).padStart(4, '0') + " PID: " + deviceInfo.usbProductId.toString(16).padStart(4, '0');
                this.element.appendChild(ids);
            }
        }

        this.statusContainer.classList.add('absolute', 'flex', 'size-4', 'top-4', 'right-4');
        this.statusElement.classList.add('relative', 'inline-flex', 'size-4', 'rounded-full', 'bg-green-500');
        this.pingElement.classList.add('hidden', 'absolute', 'inline-flex', 'h-full', 'w-full', 'animate-ping', 'rounded-full', 'bg-green-400', 'opacity-75');
        this.statusContainer.appendChild(this.pingElement);
        this.statusContainer.appendChild(this.statusElement);
        this.element.appendChild(this.statusContainer);
        this.flashing = false;
        this.status = "disconnected";

        this.element.appendChild(name);
        if (ids) this.element.appendChild(ids);
        
        this.element.addEventListener('click', () => {
            this.device.main.currentDevice = this.device;
        });
    }
}

export default DeviceElement;