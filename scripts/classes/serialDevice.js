import DeviceElement from "./deviceElement.js";

class SerialDevice {
    /** @type {import("./main.js").default} */
    main;

    id = Date.now() + Math.floor(Math.random() * 1000);

    /** @type {import("./manager.js")["default"]["prototype"]} */
    manager;

    /** @type {SerialPort} */
    port;

    _name = "Unknown Device";

    _active = false;

    get active() {
        return this._active;
    }

    set active(value) {
        if (this._active === value) return;
        this._active = value;
        if (value) {
            this.element.classList.add('bg-black/75');
            this.element.classList.remove('hover:bg-black/20', 'active:bg-black/40', 'cursor-pointer');
        } else {
            this.element.classList.remove('bg-black/75');
            this.element.classList.add('hover:bg-black/20', 'active:bg-black/40', 'cursor-pointer');
        }
        if (this.manager) {
            this.manager.element.classList.toggle('hidden', !value);
        }
    }

    get name() {
        return this._name;
    }

    set name(value) {
        if (this._name === value) return;
        this._name = value;
        this.deviceElement.nameElement.innerText = value;
        //Update stuff here
    }

    constructor(mainInstance, port, name = "Unknown Device") {
        this.main = mainInstance;
        this.port = port;
        this._name = name;
        if (port.connected) this.main.serialDevices.set(this.id, this);
        this.port.addEventListener('disconnect', this.onDisconnected.bind(this));
        let element = new DeviceElement(this);
        this.deviceElement = element;
        this.element = element.element;
        this.main.deviceContainerElement.appendChild(this.element);
        this.main.updateHiddenDeviceCount();
        this.main.updateDeviceListPrompt();
        this.main.sortDevices();
    }

    async onDisconnected () {
        console.log('Device disconnected:', this.port.getInfo());
        this.main.serialDevices.delete(this.id);
        this.element.remove();
        this.main.updateHiddenDeviceCount();
        this.main.updateDeviceListPrompt();
        this.main.sortDevices();
        this.manager.disconnected = true;
        if (!this.active) this.manager.element.remove();
    }
}

export default SerialDevice