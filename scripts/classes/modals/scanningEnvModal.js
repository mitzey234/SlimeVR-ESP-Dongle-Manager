import Modal from "./modal.js";

class ScanningEnvironment extends Modal {
    /** @type {import("../dongleContainer.js")["default"]["prototype"]} */
    dongleContainer;

    constructor(manager) {
        super(manager);
        this.dongleContainer = this.manager.dongleContainer;

        this.element.classList.add('flex', 'flex-col', 'gap-4');

        let title = document.createElement('h2');
        title.classList.add('text-xl', 'font-bold', 'mb-4', "text-center");
        title.innerText = "Scanning Environment";
        this.element.appendChild(title);

        //Overall Progress Bar
        let overallProgressBarContainer = document.createElement('div');
        overallProgressBarContainer.classList.add('w-full', 'h-4', 'bg-neutral-900', 'rounded', 'overflow-hidden');
        this.overallProgressBar = document.createElement('div');
        this.overallProgressBar.classList.add('w-0', 'h-full', 'bg-blue-500');
        overallProgressBarContainer.appendChild(this.overallProgressBar);
        this.element.appendChild(overallProgressBarContainer);

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
        let cancelButton = document.createElement('button');
        cancelButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer", "self-center");
        cancelButton.innerText = "Cancel Scan";
        cancelButton.onclick = () => {
            this.manager.sendCommand("scanenv");
        }
        this.element.appendChild(cancelButton);
    }

    init () {
        this.channels.forEach(channel => {
            channel.verticalProgressBar.style.height = "0%";
            channel.channelLabel.classList.remove('bg-orange-500/50');
            channel.bytes = 0;
        });
        this.overallProgressBar.style.width = "0%";
        this.estimatedTimeText.innerText = "Estimated Time Remaining: loading...";
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
    }

    updateChannel (channelNumber, bytes) {
        let channel = this.channels[channelNumber-1];
        channel.bytes = bytes;
        this.update();
        channel.channelLabel.classList.toggle('bg-orange-500/50', true);
        //Set all previous channels to remove orange
        for (let i = 0; i < channelNumber-1; i++) {
            this.channels[i].channelLabel.classList.toggle('bg-orange-500/50', false);
        }
    }

    createChannel (channelNumber) {
        let channelElement = document.createElement('div');
        channelElement.classList.add('p-2', 'rounded');
        let verticalProgressBarContainer = document.createElement('div');
        let verticalProgressBar = document.createElement('div');
        verticalProgressBarContainer.classList.add('w-4', 'h-32', 'bg-neutral-900', 'rounded', 'overflow-hidden', "flex");
        verticalProgressBar.classList.add('w-full', 'h-0', 'bg-blue-500', "self-end");
        verticalProgressBarContainer.appendChild(verticalProgressBar);
        channelElement.appendChild(verticalProgressBarContainer);
        let channelLabel = document.createElement('span');
        channelLabel.classList.add('text-sm', 'text-white', 'mt-1', 'block', 'text-center', "rounded-lg");
        channelLabel.innerText = `${channelNumber}`;
        channelElement.appendChild(channelLabel);
        this.channelsContainer.appendChild(channelElement);

        return { channelElement, verticalProgressBar, channelLabel, bytes: 0 };
    }
}

export default ScanningEnvironment;