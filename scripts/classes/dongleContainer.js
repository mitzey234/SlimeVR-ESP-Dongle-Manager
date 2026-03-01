import Tracker from "./tracker.js";
import PairedTracker from "./pairedTracker.js";

class DongleContainer {
    /** @type {import("./dongleManager.js")["default"]["prototype"]} */
    manager;

    /** @type {import("./protonDongleDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    trackerListElement = document.createElement('div');

    noTrackersElement = document.createElement('div');

    updateInterval = setInterval(this.update.bind(this), 1000);

    /** @type {Map<string, import("./tracker.js")["default"]["prototype"]>} */
    trackers = new Map();

    /** @type {Map<string, import("./pairedTracker.js")["default"]["prototype"]>} */
    pairedTrackers = new Map();

    _firmwareVersion;
    get firmwareVersion() {
        return this._firmwareVersion;
    }

    set firmwareVersion(value) {
        if (this._firmwareVersion === value) return;
        this._firmwareVersion = value;
        this.firmwareText.innerText = `Version: ${this._firmwareVersion}`;
        if (this.isLatestFirmwareVersion()) {
            this.checkForUpdatesIcon.classList.add('hidden');
            this.updateIcon.classList.add('hidden');
        } else {
            this.checkForUpdatesIcon.classList.remove('hidden');
            this.updateIcon.classList.remove('hidden');
        }
        this.manager.device.deviceElement.subtext1 = `Version: ${this._firmwareVersion}`;
    }

    _macAddress;
    get macAddress() {
        return this._macAddress;
    }

    set macAddress(value) {
        if (this._macAddress === value) return;
        this._macAddress = value;
        this.macText.innerText = `MAC: ${this._macAddress}`;
        this.manager.device.deviceElement.subtext2 = `MAC: ${this._macAddress}`;
    }

    _packetsPerSecond;
    get packetsPerSecond() {
        return this._packetsPerSecond;
    }

    set packetsPerSecond(value) {
        if (this._packetsPerSecond === value) return;
        this._packetsPerSecond = value;
        this.dataRateText.innerText = `Data Rates: ` + (this._packetsPerSecond ? `${this._packetsPerSecond} P` : "") + (this._bytesPerSecond ? ` | ${this._bytesPerSecond} B` : "");
    }

    _bytesPerSecond;
    get bytesPerSecond() {
        return this._bytesPerSecond;
    }

    set bytesPerSecond(value) {
        if (this._bytesPerSecond === value) return;
        this._bytesPerSecond = value;
        this.dataRateText.innerText = `Data Rates: ` + (this._packetsPerSecond ? `${this._packetsPerSecond} P` : "0 P") + (this._bytesPerSecond ? ` | ${this._bytesPerSecond} B` : "");
    }

    _channel;
    get channel() {
        return this._channel;
    }

    set channel(value) {
        if (this._channel === value) return;
        this._channel = value;
        this.channelText.innerText = `Channel: ${this._channel}`;
    }

    _temperature;
    get temperature() {
        return this._temperature;
    }

    set temperature(value) {
        if (this._temperature === value) return;
        this._temperature = value;
        this.temperatureText.innerText = `Temperature: ${this._temperature}°C`;
        this.temperatureText.classList.toggle('text-red-500', this._temperature >= 85);
        this.temperatureText.classList.toggle('text-yellow-500', this._temperature >= 65 && this._temperature < 85);
        this.temperatureText.classList.toggle('text-green-500', this._temperature < 65);
        this.temperatureText.title = "Chip Temperature" + (this._temperature >= 85 ? " (High, max design temp 105°C)" : "");
    }

    uptime;

    constructor(manager, device) {
        this.manager = manager;
        this.device = device;

        this.element.role = "Dongle Management Container";
        this.element.classList.add('flex', 'flex-row', 'h-full', 'w-full');

        let listContainer = document.createElement('div');
        listContainer.role = "Container";
        listContainer.classList.add('flex', 'flex-col', 'w-64', 'h-full', "bg-black/25");

        let trackerMetrics = document.createElement('div');
        trackerMetrics.classList.add('text-md', 'text-white', 'p-2', "bg-black/50", "text-center", "select-none");
        this.trackerCountMetric = document.createElement('div');
        this.trackerCountMetric.innerText = `Connected Trackers: ${this.trackers.size}`;
        trackerMetrics.appendChild(this.trackerCountMetric);

        let averageMetrics = document.createElement('div');
        averageMetrics.classList.add('text-xs', 'text-white/50');
        averageMetrics.appendChild(document.createTextNode("Averages: "));
        this.averageLatencyText = document.createElement('span');
        this.averageLatencyText.innerText = `N/A`;
        averageMetrics.appendChild(this.averageLatencyText);
        let separator = document.createElement('span');
        separator.innerText = " | ";
        averageMetrics.appendChild(separator);
        this.averageRssiText = document.createElement('span');
        this.averageRssiText.innerText = `N/A`;
        averageMetrics.appendChild(this.averageRssiText);
        trackerMetrics.appendChild(averageMetrics);

        let maximumMetrics = document.createElement('div');
        maximumMetrics.classList.add('text-xs', 'text-white/50');
        maximumMetrics.appendChild(document.createTextNode("Maximums: "));
        this.maxLatencyText = document.createElement('span');
        this.maxLatencyText.innerText = `N/A`;
        maximumMetrics.appendChild(this.maxLatencyText);
        let maxSeparator = document.createElement('span');
        maxSeparator.innerText = " | ";
        maximumMetrics.appendChild(maxSeparator);
        this.maxRssiText = document.createElement('span');
        this.maxRssiText.innerText = `N/A`;
        maximumMetrics.appendChild(this.maxRssiText);
        trackerMetrics.appendChild(maximumMetrics);

        listContainer.appendChild(trackerMetrics);

        this.trackerListElement.role = "Tracker List Container";
        this.trackerListElement.classList.add('flex', 'flex-col', 'items-start', 'justify-start', 'w-full', 'h-full', 'overflow-y-auto', 'hideScrolls');
        this.noTrackersElement.classList.add('text-white/50', 'text-sm', 'italic', "p-4", 'text-center', "bg-black/50", "rounded", "force-center", "relative!", "select-none");
        this.noTrackersElement.innerText = "No trackers connected";
        this.trackerListElement.appendChild(this.noTrackersElement);
        listContainer.appendChild(this.trackerListElement);
        this.element.appendChild(listContainer);

        let managementPanel = document.createElement('div');
        managementPanel.role = "Dongle Management Panel";
        managementPanel.classList.add('flex', 'flex-col', 'flex-1', "w-full", 'h-full');
        
        let metricsContainer = document.createElement('div');
        metricsContainer.classList.add('flex', 'flex-row', 'flex-wrap', 'items-center', 'justify-center', "bg-black/25", "p-2", "select-none", "gap-2", "[&>div]:min-w-[150px]", "2xl:[&>div]:min-w-[220px]", "2xl:[&>div]:w-fill", "[&>div]:text-center");
        
        //Firmware info and update button
        let firmwareMetric = document.createElement('div');
        firmwareMetric.classList.add('text-xs', '2xl:text-sm', 'text-white', "2xl:text-lg");
        let firmwareIcon = document.createElement('i');
        firmwareIcon.classList.add('fa-solid', 'fa-microchip', 'text-sm', '2xl:text-md', 'text-white/75', 'mr-2');
        firmwareMetric.appendChild(firmwareIcon);
        this.firmwareText = document.createElement('span');
        this.firmwareText.innerText = `Version: ${this.device.firmwareVersion}`;
        firmwareMetric.appendChild(this.firmwareText);
        this.checkForUpdatesIcon = document.createElement('i');
        this.checkForUpdatesIcon.classList.add('fa-solid', 'fa-arrow-rotate-right', 'text-sm', '2xl:text-md', 'text-blue-500', "hover:text-blue-700", "active:text-blue-900", 'ml-2', "cursor-pointer", "transition", "duration-200", "ease-in-out", "hidden");
        this.checkForUpdatesIcon.title = "Check for updates";
        this.checkForUpdatesIcon.addEventListener('click', (e) => this.manager.checkForFirmwareUpdates(e));
        firmwareMetric.appendChild(this.checkForUpdatesIcon);
        this.updateIcon = document.createElement('i');
        this.updateIcon.classList.add('fa-solid', 'fa-circle-up', 'text-sm', '2xl:text-md', 'text-green-500', "hover:text-green-700", "active:text-green-900", 'ml-2', "cursor-pointer", "transition", "duration-200", "ease-in-out", "hidden");
        this.updateIcon.title = "Update firmware";
        this.updateIcon.addEventListener('click', () => {
            if (this.isLatestFirmwareVersion()) return;
            //TODO: Implement firmware update process
        });
        metricsContainer.appendChild(firmwareMetric);

        // Dongle mac address
        let macMetric = document.createElement('div');
        macMetric.classList.add('text-xs', '2xl:text-sm', 'text-white', "2xl:text-lg");
        let macIcon = document.createElement('i');
        macIcon.classList.add('fa-solid', 'fa-wifi', 'text-sm', '2xl:text-md', 'text-white/75', 'mr-2');
        macMetric.appendChild(macIcon);
        this.macText = document.createElement('span');
        this.macText.classList.add('text-xs', '2xl:text-sm', 'text-white', "hover:text-blue-500", "active:text-blue-700", "cursor-pointer");
        this.macText.innerText = `MAC: Loading...`;
        this.macText.title = "Click to copy MAC address to clipboard";
        this.macText.addEventListener('click', () => {
            navigator.clipboard.writeText(this.macAddress);
            this.macText.innerText = "MAC Copied!";
            setTimeout(() => {
                this.macText.innerText = `MAC: ${this.macAddress}`;
            }, 1000);
        });
        macMetric.appendChild(this.macText);
        metricsContainer.appendChild(macMetric);

        //Dongle Data Rates
        let dataRateMetric = document.createElement('div');
        dataRateMetric.classList.add('text-xs', '2xl:text-sm', 'text-white', "2xl:text-lg");
        let dataRateIcon = document.createElement('i');
        dataRateIcon.classList.add('fa-solid', 'fa-chart-line', 'text-sm', '2xl:text-md', 'text-white/75', 'mr-2');
        dataRateMetric.appendChild(dataRateIcon);
        this.dataRateText = document.createElement('span');
        this.dataRateText.innerText = `Data Rates: Loading`;
        this.dataRateText.title = "Packets per second and bytes per second received from all trackers";
        dataRateMetric.appendChild(this.dataRateText);
        metricsContainer.appendChild(dataRateMetric);

        //Dongle Wifi Channel
        let channelMetric = document.createElement('div');
        channelMetric.classList.add('text-xs', '2xl:text-sm', 'text-white', "2xl:text-lg");
        let channelIcon = document.createElement('i');
        channelIcon.classList.add('fa-solid', 'fa-walkie-talkie', 'text-sm', '2xl:text-md', 'text-white/75', 'mr-2');
        channelMetric.appendChild(channelIcon);
        this.channelText = document.createElement('span');
        this.channelText.title = "Click here to change the wireless channel";
        this.channelText.classList.add('text-xs', '2xl:text-sm', 'text-white', "hover:text-blue-500", "active:text-blue-700", "active:text-blue-900", "cursor-pointer");
        this.channelText.innerText = `Channel: Loading`;
        this.channelText.addEventListener('click', async () => {
            let channel = await this.manager.customInput.requestInput("Change Wireless Channel", "Enter a new wireless channel for the dongle (1-11)\nChanging the wireless channel can help avoid interference from other devices and improve connection quality\n\nNote: This will temporarily disconnect all trackers for a few seconds.", "number", "Change Channel", "Cancel", this.channel, false, (input) => {
                if (input == null || input.trim() === "") return "Channel cannot be empty";
                let channel = parseInt(input.trim());
                if (isNaN(channel) || channel < 1 || channel > 11) return "Channel must be a number between 1 and 11";
                return null;
            });
            if (channel != null) {
                this.manager.sendCommand("setchannel " + channel);
            }
            // TODO: Prompt user for new channel and send command to dongle to change it
        });
        channelMetric.appendChild(this.channelText);
        metricsContainer.appendChild(channelMetric);

        let temperatureMetric = document.createElement('div');
        temperatureMetric.classList.add('text-xs', '2xl:text-sm', 'text-white', "2xl:text-lg");
        let temperatureIcon = document.createElement('i');
        temperatureIcon.classList.add('fa-solid', 'fa-temperature-three-quarters', 'text-sm', '2xl:text-md', 'text-white/75', 'mr-2');
        temperatureMetric.appendChild(temperatureIcon);
        this.temperatureText = document.createElement('span');
        this.temperatureText.innerText = `Temperature: Loading`;
        temperatureMetric.appendChild(this.temperatureText);
        metricsContainer.appendChild(temperatureMetric);

        let uptimeMetric = document.createElement('div');
        uptimeMetric.classList.add('text-xs', '2xl:text-sm', 'text-white', "2xl:text-lg");
        let uptimeIcon = document.createElement('i');
        uptimeIcon.classList.add('fa-solid', 'fa-clock', 'text-sm', '2xl:text-md', 'text-white/75', 'mr-2');
        uptimeMetric.appendChild(uptimeIcon);
        this.uptimeText = document.createElement('span');
        this.uptimeText.innerText = `Uptime: Loading`;
        uptimeMetric.appendChild(this.uptimeText);
        metricsContainer.appendChild(uptimeMetric);

        //End of metrics, add them to the management panel
        managementPanel.appendChild(metricsContainer);

        this.buttonContainer = document.createElement('div');
        this.buttonContainer.classList.add('flex', 'flex-col', 'gap-3', "items-center", 'p-8', 'overflow-y-auto', "h-full", "w-full", "*:w-64", "xl:*:w-86", "select-none", "hideScrolls");

        this.pairingButton = document.createElement('button');
        this.pairingButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.pairingButton.innerText = "Enter Pairing Mode";
        this.pairingButton.addEventListener('click', this.device.togglePairingMode.bind(this.device));
        this.buttonContainer.appendChild(this.pairingButton);

        this.scanEnvironmentButton = document.createElement('button');
        this.scanEnvironmentButton.classList.add('bg-purple-500', 'hover:bg-purple-700', 'active:bg-purple-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.scanEnvironmentButton.innerText = "Scan Wireless Environment";
        this.scanEnvironmentButton.addEventListener('click', async () => {
            let result = await this.manager.confirmation.confirm("Scan Wireless Environment", "This will scan the wireless environment for other devices and display the occupation of each wireless channel\nThis can help the dongle identify sources of interference and try to avoid them by selecting a less occupied channel\n\nNote: This scan may take a few moments and WILL disconnect all trackers until the process is complete.", "Start Scan", "Cancel");
            if (result) {
                this.manager.sendCommand("scanenv");
            }
        });
        this.buttonContainer.appendChild(this.scanEnvironmentButton);

        this.changeSecurityKeyButton = document.createElement('button');
        this.changeSecurityKeyButton.classList.add('bg-gray-500', 'hover:bg-gray-700', 'active:bg-gray-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.changeSecurityKeyButton.innerText = "Change Security Key";
        this.changeSecurityKeyButton.addEventListener('click', async () => {
            let input = await this.manager.customInput.requestInput("Change Security Key", "Enter a new security key for the dongle\nThis key is used to restrict communications between the dongle and trackers, so it should be kept hidden.\n\nNote: Changing the security key will require all currently paired trackers to be re-paired with the new key.", "text", "Change Key", "Cancel", "New Security Key", false, (input) => {
                if (input == null || input.trim() === "") return "Security key cannot be empty";
                if (input.indexOf(":") >= 0) {
                    let count = (input.match(/:/g) || []).length;
                    if (count !== 7) return "Encoded security key must be 8 bytes (16 hexadecimal characters) separated by colons (e.g. 00:00:00:00:00:00:00:00)";
                    else {
                        let parts = input.split(":");
                        for (let part of parts) {
                            if (part.length !== 2 || isNaN(parseInt(part, 16))) {
                                return "Encoded security key must be 8 bytes (16 hexadecimal characters) separated by colons (e.g. 00:00:00:00:00:00:00:00)";
                            }
                        }
                    }
                }
                if (isNaN(parseInt(input.trim(), 16))) return "Security key must be a valid hexadecimal string";
                return null;
            });
            if (input != null && input.trim() !== "") {
                let key = input.trim();
                if (key.indexOf(":") >= 0) key = key.split(":").join("");
                //Ensure length is 16 characters pad with zeros if too short, truncate if too long
                if (key.length < 16) {
                    key = key.padEnd(16, "0");
                } else if (key.length > 16) {
                    key = key.substring(0, 16);
                }
                this.manager.sendCommand("setsecurity " + key);
            }
        });
        this.buttonContainer.appendChild(this.changeSecurityKeyButton);

        // TODO: OTA updates delayed
        this.startOTAUpdateButton = document.createElement('button');
        this.startOTAUpdateButton.classList.add('bg-green-500', 'hover:bg-green-700', 'active:bg-green-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0", "hidden");
        this.startOTAUpdateButton.innerText = "Start OTA Update";
        this.startOTAUpdateButton.addEventListener('click', () => {
            // TODO: Implement start OTA update functionality
        });
        this.buttonContainer.appendChild(this.startOTAUpdateButton);

        this.managePairedTrackersButton = document.createElement('button');
        this.managePairedTrackersButton.classList.add('bg-teal-500', 'hover:bg-teal-700', 'active:bg-teal-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.managePairedTrackersButton.innerText = "Manage Paired Trackers";
        this.managePairedTrackersButton.addEventListener('click', () => {
            this.manager.pairedTrackersManager.open();
        });
        this.buttonContainer.appendChild(this.managePairedTrackersButton);

        this.rebootButton = document.createElement('button');
        this.rebootButton.classList.add('bg-yellow-500', 'hover:bg-yellow-700', 'active:bg-yellow-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.rebootButton.innerText = "Reboot Dongle";
        this.rebootButton.addEventListener('click', async () => {
            let result = await this.manager.confirmation.confirm("Reboot Dongle", "Are you sure you want to reboot the dongle?", "Reboot", "Cancel");
            if (result) {
                this.manager.sendCommand("reboot");
            }
        });
        this.buttonContainer.appendChild(this.rebootButton);

        this.enterDFUButton = document.createElement('button');
        this.enterDFUButton.classList.add('bg-orange-500', 'hover:bg-orange-700', 'active:bg-orange-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.enterDFUButton.innerText = "Enter DFU Mode";
        this.enterDFUButton.title = "Hold Shift and click to enter DFU mode without confirmation";
        this.enterDFUButton.addEventListener('click', async (e) => {
            if (e.shiftKey) return this.device.enterDFU();
            let result = await this.manager.confirmation.confirm("Enter DFU Mode", "Are you sure you want to enter DFU mode?\nThis mode is used for firmware updates and should only be used when necessary.", "Enter DFU", "Cancel");
            if (result)  this.device.enterDFU();
        });
        this.buttonContainer.appendChild(this.enterDFUButton);

        this.factoryResetButton = document.createElement('button');
        this.factoryResetButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer", "outline-none", "ring-0");
        this.factoryResetButton.innerText = "Factory Reset";
        this.factoryResetButton.addEventListener('click', async () => {
            let result = await this.manager.confirmation.confirm("Factory Reset", "Are you sure you want to factory reset the dongle?\nThis will erase all settings and paired trackers.", "Factory Reset", "Cancel", true);
            if (result) {
                this.manager.sendCommand("factoryreset");
            }
        });
        this.buttonContainer.appendChild(this.factoryResetButton);
        managementPanel.appendChild(this.buttonContainer);
        this.element.appendChild(managementPanel);
    }

    update () {
        if (this.manager.disconnected) {
            clearInterval(this.updateInterval);
            return;
        }
        if (this.uptime != null) {
            let uptimeSeconds =  Math.floor((Date.now()/1000) - this.uptime);
            let days = Math.floor(uptimeSeconds / 86400);
            let hours = Math.floor((uptimeSeconds % 86400) / 3600);
            let minutes = Math.floor((uptimeSeconds % 3600) / 60);
            let seconds = uptimeSeconds % 60;
            let uptimeParts = [];
            if (days > 0) {
                uptimeParts.push(String(days).padStart(2, '0'));
                uptimeParts.push(String(hours).padStart(2, '0'));
                uptimeParts.push(String(minutes).padStart(2, '0'));
                uptimeParts.push(String(seconds).padStart(2, '0'));
            } else if (hours > 0) {
                uptimeParts.push(String(hours).padStart(2, '0'));
                uptimeParts.push(String(minutes).padStart(2, '0'));
                uptimeParts.push(String(seconds).padStart(2, '0'));
            } else if (minutes > 0) {
                uptimeParts.push(String(minutes).padStart(2, '0'));
                uptimeParts.push(String(seconds).padStart(2, '0'));
            } else {
                uptimeParts.push(String(seconds));
            }
            this.uptimeText.innerText = `Uptime: ${uptimeParts.join(':')}`;
        }
    }

    /** @param {import("./messages/initMessage.js")["default"]["prototype"]} message */
    init (message) {
        this.device.name = message.productName;
        this.firmwareVersion = message.firmwareVersion;
        this.macAddress = message.macAddress;
        this.uptime = message.bootTime;
        message.pairedTrackers.forEach(trackerInfo => this.addPairedTracker(trackerInfo, true));
        message.trackers.forEach(trackerInfo => this.addTracker(trackerInfo, true));
        this.sortTrackers();
        this.channel = message.channel;
        this.manager.pairing = message.pairingMode;
        this.manager.scanningEnvironment = message.scanningEnvironment;
        this.update();
    }

    /**
     * @param {import("./messages/rawTrackerType.js")["default"]["prototype"]} trackerInfo 
     * @param {boolean} skipSort 
     */
    addTracker(trackerInfo, skipSort = false) {
        let tracker = new Tracker(trackerInfo);
        tracker.unpairButton.addEventListener('click', async (e) => {
            if (e.shiftKey) {
                this.manager.sendCommand("unpair " + tracker.mac.toLocaleLowerCase());
                tracker.element.remove();
                this.trackers.delete(tracker.id);
                this.updateTrackerList();
                this.sortTrackers();
                this.removePairedTracker(tracker.id);
                return;
            }
            let result = await this.manager.confirmation.confirm("Unpair Tracker - " + tracker.trackerId, `Are you sure you want to unpair tracker ${tracker.trackerId} (${tracker.mac})`, "Unpair", "Cancel", true);
            if (result) {
                this.manager.sendCommand("unpair " + tracker.mac.toLocaleLowerCase());
                tracker.element.remove();
                this.trackers.delete(tracker.id);
                this.updateTrackerList();
                this.sortTrackers();
                this.removePairedTracker(tracker.id);
            }
        });
        tracker.update = this.updateTrackerList.bind(this);
        this.trackers.set(tracker.id, tracker);
        this.trackerListElement.appendChild(tracker.element);
        this.updateTrackerList();
        if (!skipSort) this.sortTrackers();

        if (!this.pairedTrackers.has(tracker.id)) this.addPairedTracker(trackerInfo, skipSort);

        if (this.pairedTrackers.has(tracker.id)) this.pairedTrackers.get(tracker.id).connected = true;
    }

    removeTracker(trackerId) {
        let tracker = this.trackers.get(trackerId);
        if (tracker) {
            this.trackers.delete(trackerId);
            tracker.element.remove();
            this.updateTrackerList();
            this.sortTrackers();
        }

        if (this.pairedTrackers.has(tracker.id)) this.pairedTrackers.get(tracker.id).connected = false;
    }

    /**
     * @param {import("./messages/rawTrackerType.js")["default"]["prototype"]} trackerInfo 
     */
    updateTracker(trackerInfo) {
        let tracker = this.trackers.get(trackerInfo.id);
        if (tracker) {
            tracker.latency = trackerInfo.latency;
            tracker.rssi = trackerInfo.rssi;
            tracker.missedPings = trackerInfo.missedPings;
            tracker.bytesPerSecond = trackerInfo.bytesPerSecond;
            tracker.packetsPerSecond = trackerInfo.packetsPerSecond;
        } else {
            this.addTracker(trackerInfo);
        }
    }

    clearTrackers() {
        this.trackers.forEach(tracker => tracker.element.remove());
        this.trackers.clear();
        this.updateTrackerList();
    }

    /**
     * @param {import("./messages/rawPairedTrackerType.js")["default"]["prototype"]} trackerInfo 
     * @param {boolean} skipSort 
     */
    addPairedTracker(trackerInfo, skipSort = false) {
        let tracker = new PairedTracker(trackerInfo);
        if (this.trackers.has(tracker.id)) tracker.connected = true;
        tracker.unpairButton.addEventListener('click', () => {
            tracker.element.remove();
            this.manager.sendCommand("unpair " + tracker.mac.toLocaleLowerCase());
        });
        tracker.update = this.manager.pairedTrackersManager.update.bind(this.manager.pairedTrackersManager);
        this.pairedTrackers.set(tracker.id, tracker);
        this.manager.pairedTrackersManager.listContainer.appendChild(tracker.element);
        this.manager.pairedTrackersManager.update();
        if (!skipSort) this.manager.pairedTrackersManager.sort();
    }

    removePairedTracker(trackerId) {
        let tracker = this.pairedTrackers.get(trackerId);
        if (tracker) {
            this.pairedTrackers.delete(trackerId);
            tracker.element.remove();
            this.manager.pairedTrackersManager.update();
            this.manager.pairedTrackersManager.sort();
        }
    }

    clearPairedTrackers() {
        this.pairedTrackers.forEach(tracker => tracker.element.remove());
        this.pairedTrackers.clear();
        this.manager.pairedTrackersManager.update();
        this.manager.pairedTrackersManager.sort();
    }

    updateTrackerList() {
        if (this.trackers.size === 0) {
            this.noTrackersElement.classList.remove('hidden');
            this.averageLatencyText.innerText = `N/A`;
            this.averageRssiText.innerText = `N/A`;
            this.averageRssiText.classList.remove('text-green-300', 'text-yellow-300', 'text-red-300');
            this.maxLatencyText.innerText = `N/A`;
            this.maxRssiText.innerText = `N/A`;
            this.maxRssiText.classList.remove('text-green-300', 'text-yellow-300', 'text-red-300');
        } else {
            this.noTrackersElement.classList.add('hidden');
            let totalLatency = 0;
            let totalRssi = 0;
            let maxLatency = 0;
            let maxRssi = Infinity;
            this.trackers.forEach(tracker => {
                totalLatency += tracker.latency;
                totalRssi += tracker.rssi;
                if (tracker.latency > maxLatency) maxLatency = tracker.latency;
                if (tracker.rssi < maxRssi) maxRssi = tracker.rssi;
            });
            let averageLatency = totalLatency / this.trackers.size;
            let averageRssi = totalRssi / this.trackers.size;
            this.averageLatencyText.innerText = `${averageLatency.toFixed(2)}ms`;
            this.averageRssiText.innerText = `${averageRssi.toFixed(2)}dBm`;
            this.maxLatencyText.innerText = `${maxLatency.toFixed(2)}ms`;
            this.maxRssiText.innerText = `${maxRssi.toFixed(2)}dBm`;
            this.averageRssiText.classList.toggle('text-green-300', averageRssi > -55);
            this.averageRssiText.classList.toggle('text-yellow-300', averageRssi <= -55 && averageRssi > -75);
            this.averageRssiText.classList.toggle('text-red-300', averageRssi <= -75);
            this.maxRssiText.classList.toggle('text-green-300', maxRssi > -55);
            this.maxRssiText.classList.toggle('text-yellow-300', maxRssi <= -55 && maxRssi > -75);
            this.maxRssiText.classList.toggle('text-red-300', maxRssi <= -75);
        }
        this.trackerCountMetric.innerText = `Connected Trackers: ${this.trackers.size}`;
    }

    sortTrackers() {
        Array.from(this.trackers.values()).sort((a, b) => a.trackerId - b.trackerId).forEach((tracker, index) => tracker.element.style.order = index);
    }

    isLatestFirmwareVersion() {
        //Implement this later when I add firmware updates
        return true;
    }
}

export default DongleContainer;