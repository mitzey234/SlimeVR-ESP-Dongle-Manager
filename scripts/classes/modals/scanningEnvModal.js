import Modal from "./modal.js";

class ScanningEnvironment extends Modal {
    /** @type {import("../dongleContainer.js")["default"]["prototype"]} */
    dongleContainer;

    /** @type {number} */
    scanningTime;

    _selectedChannel;

    get totalElapsedTime () {
        let sum = 0;
        this.channels.forEach(channel => sum += Math.round(channel.elapsed / 1000)*1000);
        return sum;
    }

    get maxBytes () {
        let max = 0;
        this.channels.forEach(channel => {
            if (channel.bytes > max) max = channel.bytes;
        });
        return max;
    }

    get selectedChannel() {
        return this._selectedChannel;
    }

    set selectedChannel(value) {
        if (this._selectedChannel === value) return;
        let recommendedChannel = this._selectedChannel == null ? value : null;
        this._selectedChannel = value;
        if (value != null) {
            this.cancelButton.classList.add('hidden');
            this.resultsExplainer.classList.remove('hidden');
            this.estimatedTimeText.classList.add('hidden');
            this.overallProgressBarContainer.classList.add('hidden');
            this.recommendedChannelText.classList.remove('hidden');
            if (recommendedChannel != null) this.recommendedChannelText.innerText = `Recommended Channel: ${recommendedChannel}`;
            this.channels.forEach((channel, index) => {
                channel.channelLabel.classList.remove('bg-orange-500/50');
                let percentage = this.maxBytes > 0 ? (channel.bytes / this.maxBytes) * 100 : 0;
                channel.verticalProgressBar.classList.toggle("bg-blue-500", percentage <= 50);
                channel.verticalProgressBar.classList.toggle("bg-yellow-500", percentage > 50 && percentage <= 75);
                channel.verticalProgressBar.classList.toggle("bg-orange-500", percentage > 75 && percentage < 80);
                channel.verticalProgressBar.classList.toggle("bg-red-500", percentage >= 80);
                if (index !== parseInt(value) - 1) {
                    channel.channelElement.onclick = () => {
                        this.manager.sendCommand(`setchannel ${index+1}`);
                        this.selectedChannel = index+1;
                    };
                    channel.channelElement.classList.remove('bg-blue-500/50', "cursor-pointer");
                    channel.channelElement.classList.add('hover:bg-neutral-500/50', "cursor-pointer");
                } else {
                    channel.channelElement.onclick = null;
                    channel.channelElement.classList.remove('hover:bg-neutral-500/50', "cursor-pointer");
                    channel.channelElement.classList.add('bg-blue-500/50');
                    if (recommendedChannel != null) channel.channelLabel.classList.add('bg-green-500/50');
                }
            });
        } else {
            this.cancelButton.classList.remove('hidden');
            this.resultsExplainer.classList.add('hidden');
            this.estimatedTimeText.classList.remove('hidden');
            this.recommendedChannelText.classList.add('hidden');
            this.overallProgressBarContainer.classList.remove('hidden');
            this.channels.forEach(channel => {
                channel.channelElement.onclick = null;
                channel.channelElement.classList.remove('bg-blue-500/50', 'hover:bg-neutral-500/50', "cursor-pointer");
                channel.channelLabel.classList.remove('bg-green-500/50');
            });
        }
    }

    constructor(manager) {
        super(manager);
        this.dongleContainer = this.manager.dongleContainer;

        this.element.classList.add('flex', 'flex-col', 'gap-4');

        let title = document.createElement('h2');
        title.classList.add('text-xl', 'font-bold', 'mb-4', "text-center");
        title.innerText = "Scanning Environment";
        this.element.appendChild(title);

        //Overall Progress Bar
        this.overallProgressBarContainer = document.createElement('div');
        this.overallProgressBarContainer.classList.add('w-full', 'h-4', 'bg-neutral-900', 'rounded', 'overflow-hidden');
        this.overallProgressBar = document.createElement('div');
        this.overallProgressBar.classList.add('w-0', 'h-full', 'bg-blue-500', "transition-width", "duration-500", "ease-in-out");
        this.overallProgressBarContainer.appendChild(this.overallProgressBar);
        this.element.appendChild(this.overallProgressBarContainer);

        //Estimated Time Remaining
        this.estimatedTimeText = document.createElement('span');
        this.estimatedTimeText.classList.add('text-sm', 'text-white', 'block', 'text-center');
        this.estimatedTimeText.innerText = "Estimated Time Remaining: loading...";
        this.element.appendChild(this.estimatedTimeText);

        this.channelsContainer = document.createElement('div');
        this.channelsContainer.classList.add('flex', 'flex-row', 'justify-center', "items-center");
        this.element.appendChild(this.channelsContainer);

        this.channels = [];
        for (let i = 0; i < 11; i++) {
            let channel = this.createChannel(i+1);
            this.channels.push(channel);
            this.channelsContainer.appendChild(channel.channelElement);
            channel.verticalProgressBar.style.height = "0%";
        }

        //Cancel Button
        this.cancelButton = document.createElement('button');
        this.cancelButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer", "self-center");
        this.cancelButton.innerText = "Cancel Scan";
        this.cancelButton.onclick = () => {
            this.manager.sendCommand("scanenv");
        }
        this.element.appendChild(this.cancelButton);

        //Recommended Channel Text
        this.recommendedChannelText = document.createElement('span');
        this.recommendedChannelText.classList.add('text-lg', 'text-white/75', 'mt-4', 'text-center', "hidden", "font-semibold");
        this.recommendedChannelText.innerText = "Recommended Channel: loading...";
        this.element.appendChild(this.recommendedChannelText);

        //Results Explainer
        this.resultsExplainer = document.createElement('span');
        this.resultsExplainer.classList.add('text-sm', 'text-white/75', 'mt-4', 'text-center', "hidden");
        this.resultsExplainer.innerText = "The bars above represent the amount of Wi-Fi traffic detected on each channel - The taller the bar, the more traffic is present\nThe currently highlighted channel is the one the dongle has automatically selected for usage\nYou can click on any channel to manually select it";
        this.element.appendChild(this.resultsExplainer);
    }

    init () {
        this.channels.forEach(channel => {
            channel.verticalProgressBar.style.height = "0%";
            channel.channelLabel.classList.remove('bg-orange-500/50');
            channel.bytes = 0;
            channel.elapsed = 0;
            channel.verticalProgressBar.classList.add("bg-blue-500");
            channel.verticalProgressBar.classList.remove("bg-yellow-500");
            channel.verticalProgressBar.classList.remove("bg-orange-500");
            channel.verticalProgressBar.classList.remove("bg-red-500");
        });
        this.overallProgressBar.style.width = "0%";
        this.estimatedTimeText.innerText = "Estimated Time Remaining: loading...";
        this.selectedChannel = null;
    }

    update () {
        let max = 0;
        this.channels.forEach(channel => {
            if (channel.bytes > max) max = channel.bytes;
        });
        this.channels.forEach(channel => {
            let height = (channel.bytes / max) * 100;
            channel.verticalProgressBar.style.height = `${height}%`;
        });
        if (this.scanningTime != null) {
            let elapsed = this.totalElapsedTime;
            let totalTime = this.scanningTime * this.channels.length;
            let remaining = totalTime - elapsed;
            let minutes = Math.floor(remaining / 60000);
            let seconds = Math.ceil((remaining % 60000) / 1000);
            this.estimatedTimeText.innerText = `Estimated Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
            this.overallProgressBar.style.width = `${(elapsed / totalTime) * 100}%`;
        } else {
            this.estimatedTimeText.innerText = `Estimated Time Remaining: Loading...`;
        }
    }

    updateChannel (channelNumber, bytes, elapsed) {
        let channel = this.channels[channelNumber-1];
        channel.bytes = bytes;
        channel.elapsed = elapsed;
        channel.verticalProgressBar.title = `${bytes} bytes`;
        this.update();
        if (this.selectedChannel != null) return;
        channel.channelLabel.classList.toggle('bg-orange-500/50', true);
        //Set all previous channels to remove orange
        for (let i = 0; i < channelNumber-1; i++) {
            if (this.scanningTime != null) this.channels[i].elapsed = this.scanningTime;
            this.channels[i].channelLabel.classList.toggle('bg-orange-500/50', false);
        }
    }

    createChannel (channelNumber) {
        let channelElement = document.createElement('div');
        channelElement.classList.add('p-2', 'rounded');
        let verticalProgressBarContainer = document.createElement('div');
        let verticalProgressBar = document.createElement('div');
        verticalProgressBarContainer.classList.add('w-4', 'h-32', 'bg-neutral-900', 'rounded', 'overflow-hidden', "flex");
        verticalProgressBar.classList.add('w-full', 'h-0', 'bg-blue-500', "self-end", "transition-height", "duration-500", "ease-in-out");
        verticalProgressBarContainer.appendChild(verticalProgressBar);
        channelElement.appendChild(verticalProgressBarContainer);
        let channelLabel = document.createElement('span');
        channelLabel.classList.add('text-sm', 'text-white', 'mt-1', 'block', 'text-center', "rounded-lg");
        channelLabel.innerText = `${channelNumber}`;
        channelElement.appendChild(channelLabel);
        this.channelsContainer.appendChild(channelElement);

        return { channelElement, verticalProgressBar, channelLabel, bytes: 0, elapsed: 0 };
    }
}

export default ScanningEnvironment;