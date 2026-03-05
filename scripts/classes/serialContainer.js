class SerialContainer {
    /** @type {import("./serialManager.js")["default"]["prototype"]} */
    manager;

    /** @type {import("./serialDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    _macAddress;
    get macAddress() {
        return this._macAddress;
    }

    set macAddress(value) {
        if (this._macAddress === value) return;
        this._macAddress = value;
        this.manager.device.deviceElement.subtext2 = `MAC: ${this._macAddress}`;
    }

    constructor(manager, device) {
        this.manager = manager;
        this.device = device;

        this.element.role = "Serial Management Container";
        this.element.classList.add('flex', 'flex-row', 'h-full', 'w-1/2');

        let managementPanel = document.createElement('div');
        managementPanel.role = "Serial Management Panel";
        managementPanel.classList.add('flex', 'flex-col', 'flex-1', "w-full", 'h-full');
        
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.classList.add('flex', 'flex-col', 'gap-3', "items-center", 'p-8', 'overflow-y-auto', "h-full", "w-full", "*:w-64", "xl:*:w-86", "select-none", "hideScrolls");


        this.connectESPTool = document.createElement('button');
        this.connectESPTool.classList.add('bg-green-500', 'hover:bg-green-700', 'active:bg-green-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.connectESPTool.innerText = "Connect ESPTool";
        this.connectESPTool.addEventListener('click', this.manager.connectESPTool.bind(this.manager));
        this.buttonContainer.appendChild(this.connectESPTool);


        this.returnToFirmware = document.createElement('button');
        this.returnToFirmware.classList.add('bg-yellow-500', 'hover:bg-yellow-700', 'active:bg-yellow-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0", "hidden");
        this.returnToFirmware.innerText = "Return to Firmware";
        this.returnToFirmware.addEventListener('click', this.manager.returnToFirmware.bind(this.manager));
        this.buttonContainer.appendChild(this.returnToFirmware);


        managementPanel.appendChild(this.buttonContainer);
        this.element.appendChild(managementPanel);

        manager.element.appendChild(this.element);
    }
}

export default SerialContainer;