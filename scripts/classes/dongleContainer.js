import Tracker from "./tracker.js";

class DongleContainer {
    /** @type {import("./dongleManager.js")["default"]["prototype"]} */
    manager;

    /** @type {import("./protonDongleDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    trackerListElement = document.createElement('div');

    noTrackersElement = document.createElement('div');

    /** @type {Map<string, import("./tracker.js")["default"]["prototype"]>} */
    trackers = new Map();

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
        this.dataRateText.innerText = `Data Rates: ` + (this._packetsPerSecond ? `${this._packetsPerSecond} Pps` : "") + (this._bytesPerSecond ? ` | ${this._bytesPerSecond} Bps` : "");
    }

    _bytesPerSecond;
    get bytesPerSecond() {
        return this._bytesPerSecond;
    }

    set bytesPerSecond(value) {
        if (this._bytesPerSecond === value) return;
        this._bytesPerSecond = value;
        this.dataRateText.innerText = `Data Rates: ` + (this._packetsPerSecond ? `${this._packetsPerSecond} Pps` : "0 Pps") + (this._bytesPerSecond ? ` | ${this._bytesPerSecond} Bps` : "");
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

    constructor(manager, device) {
        this.manager = manager;
        this.device = device;

        this.element.role = "Dongle Management Container";
        this.element.classList.add('flex', 'flex-row', 'h-full', 'w-full');

        let listContainer = document.createElement('div');
        listContainer.role = "Container";
        listContainer.classList.add('flex', 'flex-col', 'w-64', 'h-full', "bg-black/25");

        let trackerMetrics = document.createElement('div');
        trackerMetrics.classList.add('text-md', 'text-white', 'p-2', "bg-black/50", "text-center", "h-21", "select-none");
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
        this.noTrackersElement.classList.add('text-white/50', 'text-sm', 'italic', "p-4", 'text-center', "bg-black/50", "rounded", "force-center", "relative!");
        this.noTrackersElement.innerText = "No trackers connected";
        this.trackerListElement.appendChild(this.noTrackersElement);
        listContainer.appendChild(this.trackerListElement);
        this.element.appendChild(listContainer);

        let managementPanel = document.createElement('div');
        managementPanel.role = "Dongle Management Panel";
        managementPanel.classList.add('flex', 'flex-col', 'flex-1', "w-full", 'h-full');
        
        let metricsContainer = document.createElement('div');
        metricsContainer.classList.add('flex', 'flex-row', 'flex-wrap', 'items-center', 'justify-center', "bg-black/25", "p-2", "select-none", "gap-2", "xl:gap-0", "h-21");
        
        //Firmware info and update button
        let firmwareMetric = document.createElement('div');
        firmwareMetric.classList.add('text-xs', 'xl:text-sm', 'text-white', "xl:text-lg");
        let firmwareIcon = document.createElement('i');
        firmwareIcon.classList.add('fa-solid', 'fa-microchip', 'text-sm', 'xl:text-md', 'text-white/75', 'mr-2');
        firmwareMetric.appendChild(firmwareIcon);
        this.firmwareText = document.createElement('span');
        this.firmwareText.innerText = `Version: ${this.device.firmwareVersion}`;
        firmwareMetric.appendChild(this.firmwareText);
        this.checkForUpdatesIcon = document.createElement('i');
        this.checkForUpdatesIcon.classList.add('fa-solid', 'fa-arrow-rotate-right', 'text-sm', 'xl:text-md', 'text-blue-500', "hover:text-blue-700", "active:text-blue-900", 'ml-2', "cursor-pointer", "transition", "duration-200", "ease-in-out", "hidden");
        this.checkForUpdatesIcon.title = "Check for updates";
        this.checkForUpdatesIcon.addEventListener('click', (e) => this.manager.checkForFirmwareUpdates(e));
        firmwareMetric.appendChild(this.checkForUpdatesIcon);
        this.updateIcon = document.createElement('i');
        this.updateIcon.classList.add('fa-solid', 'fa-circle-up', 'text-sm', 'xl:text-md', 'text-green-500', "hover:text-green-700", "active:text-green-900", 'ml-2', "cursor-pointer", "transition", "duration-200", "ease-in-out", "hidden");
        this.updateIcon.title = "Update firmware";
        this.updateIcon.addEventListener('click', () => {
            if (this.isLatestFirmwareVersion()) return;
            //TODO: Implement firmware update process
        });
        metricsContainer.appendChild(firmwareMetric);

        let metricDivider = document.createElement('hr');
        metricDivider.classList.add('hidden', 'xl:block', 'mx-4', 'h-6', 'border-l', 'border-white/25');
        metricsContainer.appendChild(metricDivider);

        // Dongle mac address
        let macMetric = document.createElement('div');
        macMetric.classList.add('text-xs', 'xl:text-sm', 'text-white', "xl:text-lg");
        let macIcon = document.createElement('i');
        macIcon.classList.add('fa-solid', 'fa-wifi', 'text-sm', 'xl:text-md', 'text-white/75', 'mr-2');
        macMetric.appendChild(macIcon);
        this.macText = document.createElement('span');
        this.macText.classList.add('text-xs', 'xl:text-sm', 'text-white', "hover:text-blue-500", "active:text-blue-700", "cursor-pointer");
        this.macText.innerText = `MAC: Loading...`;
        this.macText.addEventListener('click', () => {
            navigator.clipboard.writeText(this.macAddress);
            this.macText.innerText = "MAC Copied!";
            setTimeout(() => {
            this.macText.innerText = `MAC: ${this.macAddress}`;
            }, 1000);
        });
        macMetric.appendChild(this.macText);
        metricsContainer.appendChild(macMetric);

        metricDivider = document.createElement('hr');
        metricDivider.classList.add('hidden', 'xl:block', 'mx-4', 'h-6', 'border-l', 'border-white/25');
        metricsContainer.appendChild(metricDivider);

        //Dongle Data Rates
        let dataRateMetric = document.createElement('div');
        dataRateMetric.classList.add('text-xs', 'xl:text-sm', 'text-white', "xl:text-lg");
        let dataRateIcon = document.createElement('i');
        dataRateIcon.classList.add('fa-solid', 'fa-chart-line', 'text-sm', 'xl:text-md', 'text-white/75', 'mr-2');
        dataRateMetric.appendChild(dataRateIcon);
        this.dataRateText = document.createElement('span');
        this.dataRateText.innerText = `Data Rates: Loading`;
        dataRateMetric.appendChild(this.dataRateText);
        metricsContainer.appendChild(dataRateMetric);

        metricDivider = document.createElement('hr');
        metricDivider.classList.add('hidden', 'xl:block', 'mx-4', 'h-6', 'border-l', 'border-white/25');
        metricsContainer.appendChild(metricDivider);

        //Dongle Wifi Channel
        let channelMetric = document.createElement('div');
        channelMetric.classList.add('text-xs', 'xl:text-sm', 'text-white', "xl:text-lg");
        let channelIcon = document.createElement('i');
        channelIcon.classList.add('fa-solid', 'fa-walkie-talkie', 'text-sm', 'xl:text-md', 'text-white/75', 'mr-2');
        channelMetric.appendChild(channelIcon);
        this.channelText = document.createElement('span');
        this.channelText.innerText = `Channel: Loading`;
        channelMetric.appendChild(this.channelText);
        metricsContainer.appendChild(channelMetric);

        //End of metrics, add them to the management panel
        managementPanel.appendChild(metricsContainer);

        this.buttonContainer = document.createElement('div');
        this.buttonContainer.classList.add('flex', 'flex-col', 'gap-3', "items-center", 'p-8', 'overflow-y-auto', "h-full", "w-full", "*:w-64", "xl:*:w-86", "select-none");

        this.pairingButton = document.createElement('button');
        this.pairingButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.pairingButton.innerText = "Enter Pairing Mode";
        this.pairingButton.addEventListener('click', this.device.togglePairingMode.bind(this.device));
        this.buttonContainer.appendChild(this.pairingButton);

        this.scanEnvironmentButton = document.createElement('button');
        this.scanEnvironmentButton.classList.add('bg-purple-500', 'hover:bg-purple-700', 'active:bg-purple-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.scanEnvironmentButton.innerText = "Scan Wireless Environment";
        this.scanEnvironmentButton.addEventListener('click', () => {
            // TODO: Implement scan wireless environment functionality
        });
        this.buttonContainer.appendChild(this.scanEnvironmentButton);

        this.changeWirelessChannelButton = document.createElement('button');
        this.changeWirelessChannelButton.classList.add('bg-green-500', 'hover:bg-green-700', 'active:bg-green-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.changeWirelessChannelButton.innerText = "Change Wireless Channel";
        this.changeWirelessChannelButton.addEventListener('click', () => {
            // TODO: Prompt user for new channel and send command to dongle to change it
        });
        this.buttonContainer.appendChild(this.changeWirelessChannelButton);

        this.changeSecurityKeyButton = document.createElement('button');
        this.changeSecurityKeyButton.classList.add('bg-gray-500', 'hover:bg-gray-700', 'active:bg-gray-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.changeSecurityKeyButton.innerText = "Change Security Key";
        this.changeSecurityKeyButton.addEventListener('click', () => {
            // TODO: Prompt user for new security key and send command to dongle to change it
        });
        this.buttonContainer.appendChild(this.changeSecurityKeyButton);

        this.startOTAUpdateButton = document.createElement('button');
        this.startOTAUpdateButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.startOTAUpdateButton.innerText = "Start OTA Update";
        this.startOTAUpdateButton.addEventListener('click', () => {
            // TODO: Implement start OTA update functionality
        });
        this.buttonContainer.appendChild(this.startOTAUpdateButton);

        this.managePairedTrackersButton = document.createElement('button');
        this.managePairedTrackersButton.classList.add('bg-teal-500', 'hover:bg-teal-700', 'active:bg-teal-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.managePairedTrackersButton.innerText = "Manage Paired Trackers";
        this.managePairedTrackersButton.addEventListener('click', () => {
            // TODO: Implement manage paired trackers functionality, maybe open a new panel that lists all paired trackers with options to rename, unpair, etc.
        });
        this.buttonContainer.appendChild(this.managePairedTrackersButton);

        this.rebootButton = document.createElement('button');
        this.rebootButton.classList.add('bg-yellow-500', 'hover:bg-yellow-700', 'active:bg-yellow-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.rebootButton.innerText = "Reboot Dongle";
        this.rebootButton.addEventListener('click', () => {
            // TODO: Prompt user with confirmation Dialog and send reboot command to dongle if they confirm
        });
        this.buttonContainer.appendChild(this.rebootButton);

        this.enterDFUButton = document.createElement('button');
        this.enterDFUButton.classList.add('bg-orange-500', 'hover:bg-orange-700', 'active:bg-orange-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.enterDFUButton.innerText = "Enter DFU Mode";
        this.enterDFUButton.addEventListener('click', () => {
            // TODO: Prompt user with confirmation Dialog and send enter DFU command to dongle if they confirm
        });
        this.buttonContainer.appendChild(this.enterDFUButton);

        this.factoryResetButton = document.createElement('button');
        this.factoryResetButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-900', 'text-white', 'py-2', 'px-4', 'rounded', "transition", "duration-200", "ease-in-out", "cursor-pointer");
        this.factoryResetButton.innerText = "Factory Reset";
        this.factoryResetButton.addEventListener('click', () => {
            // TODO: Prompt user with confirmation Dialog and send factory reset command to dongle if they confirm
        });
        this.buttonContainer.appendChild(this.factoryResetButton);



        managementPanel.appendChild(this.buttonContainer);


        this.element.appendChild(managementPanel);
    }

    /** @param {import("./messages/initMessage.js")["default"]["prototype"]} message */
    init (message) {
        this.device.name = message.productName;
        this.firmwareVersion = message.firmwareVersion;
        this.macAddress = message.macAddress;
        message.trackers.forEach(trackerInfo => this.addTracker(trackerInfo, true));
        this.sortTrackers();
        this.channel = message.channel;
        this.manager.pairing = message.pairingMode;
        this.manager.scanningEnvironment = message.scanningEnvironment;
    }

    /**
     * @param {import("./messages/rawTrackerType.js")["default"]["prototype"]} trackerInfo 
     * @param {boolean} skipSort 
     */
    addTracker(trackerInfo, skipSort = false) {
        let tracker = new Tracker(trackerInfo);
        tracker.update = this.updateTrackerList.bind(this);
        this.trackers.set(tracker.id, tracker);
        this.trackerListElement.appendChild(tracker.element);
        this.updateTrackerList();
        if (!skipSort) this.sortTrackers();
    }

    removeTracker(trackerId) {
        let tracker = this.trackers.get(trackerId);
        if (tracker) {
            this.trackers.delete(trackerId);
            tracker.element.remove();
            this.updateTrackerList();
            this.sortTrackers();
        }
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
        } else {
            this.addTracker(trackerInfo);
        }
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
            this.averageRssiText.classList.toggle('text-green-300', averageRssi > -85);
            this.averageRssiText.classList.toggle('text-yellow-300', averageRssi <= -85 && averageRssi > -100);
            this.averageRssiText.classList.toggle('text-red-300', averageRssi <= -100);
            this.maxRssiText.classList.toggle('text-green-300', maxRssi > -85);
            this.maxRssiText.classList.toggle('text-yellow-300', maxRssi <= -85 && maxRssi > -100);
            this.maxRssiText.classList.toggle('text-red-300', maxRssi <= -100);
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