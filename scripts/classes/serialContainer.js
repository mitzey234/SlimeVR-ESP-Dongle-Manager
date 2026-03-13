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


        this.eraseFlashButton = document.createElement('button');
        this.eraseFlashButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0", "hidden");
        this.eraseFlashButton.innerText = "Erase Flash";
        this.eraseFlashButton.addEventListener('click', async () => {
            let result = await this.manager.confirmation.confirm("Are you sure?", "This will erase the entire flash memory of the device, including the firmware\nThis action cannot be undone", "Yes, erase flash", "Cancel", true);
            if (result) {
                await this.manager.eraseFlash();
            }
        });
        this.buttonContainer.appendChild(this.eraseFlashButton);


        this.dongleFirmwareButton = document.createElement('button');
        this.dongleFirmwareButton.classList.add('bg-purple-500', 'hover:bg-purple-700', 'active:bg-purple-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0", "hidden");
        this.dongleFirmwareButton.innerText = "Dongle Firmware Flash";
        this.dongleFirmwareButton.addEventListener('click', () => {
            this.manager.dongleFirmwareModal.open();
        });
        this.buttonContainer.appendChild(this.dongleFirmwareButton);


        this.customFirmwareButton = document.createElement('button');
        this.customFirmwareButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0", "hidden");
        this.customFirmwareButton.innerText = "Custom Firmware Flash";
        this.customFirmwareButton.addEventListener('click', () => {
            this.manager.customFirmwareModal.open();
        });
        this.buttonContainer.appendChild(this.customFirmwareButton);

        
        this.disconnectButton = document.createElement('button');
        this.disconnectButton.classList.add('bg-gray-500', 'hover:bg-gray-700', 'active:bg-gray-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.disconnectButton.innerText = "Disconnect";
        this.disconnectButton.addEventListener('click', this.manager.disconnect.bind(this.manager));
        this.buttonContainer.appendChild(this.disconnectButton);


        managementPanel.appendChild(this.buttonContainer);
        this.element.appendChild(managementPanel);

        manager.element.appendChild(this.element);
    }
}

export default SerialContainer;