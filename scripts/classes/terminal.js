class Terminal {
    /** @type {import("./manager").default} */
    manager;

    /** @type {import("./serialDevice").default} */
    device;

    element = document.createElement('div');

    messageContainer = document.createElement('div');

    inputContainer = document.createElement('div');

    /**
     * 
     * @param {import("./manager").default} manager 
     * @param {import("./serialDevice").default} device 
     */
    constructor(manager, device) {
        this.manager = manager;
        this.device = device;
        this.element.classList.add('h-full', 'w-full', 'bg-black/75', 'flex', 'flex-col');

        //Message container
        this.messageContainer.classList.add('flex-1', 'overflow-y-auto', 'px-2', 'hideScrolls');
        this.element.appendChild(this.messageContainer);

        //Input container
        this.inputContainer.classList.add('flex', 'px-2', 'py-1', "flex-row");
        let icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-terminal', 'text-xl', 'text-white/50', 'mr-2', 'self-center');
        this.inputContainer.appendChild(icon);
        let input = document.createElement('input');
        input.classList.add('w-full', 'bg-black/50', 'bg-transparent', 'border-none', 'rounded', 'text-white', 'py-1', 'focus:outline-none', 'focus:ring-0', "text-sm");
        input.type = "text";
        input.placeholder = "Type a command and press Enter to send it to the dongle...";
        this.inputContainer.appendChild(input);
        this.element.appendChild(this.inputContainer);

        input.addEventListener('keydown', async (e) => {
            if (e.key === "Enter" && input.value.trim() !== "") {
                let command = input.value.trim();
                input.value = "";
                let result = await this.manager.sendCommand(command);
                if (!result) {
                    this.addMessage("Failed to send command to the dongle");
                } else this.addMessage("> " + command);
            }
        });
    }

    addMessage (message) {
        let messageElement = document.createElement('div');
        messageElement.classList.add('text-white', "flex", "flex-row", 'text-xs', "hover:bg-white/10", "rounded", "transition", "duration-100", "ease-in-out", "items-center");
        let timestamp = new Date().toLocaleTimeString();
        let stampElement = document.createElement('span');
        stampElement.classList.add('text-white/50', 'mr-2', 'select-none', "shrink-0");
        stampElement.innerText = `[${timestamp}]`;
        messageElement.appendChild(stampElement);

        let contentElement = document.createElement('span');
        contentElement.classList.add('whitespace-pre-wrap', 'break-words', 'flex-1', 'monospace', 'font-mono', 'max-w-full', 'overflow-hidden');
        contentElement.innerText = message.replace(/\r/g, ''); //Remove carriage returns from the message
        messageElement.appendChild(contentElement);
        this.messageContainer.appendChild(messageElement);
        // Only scroll if user is near the bottom (within 100px)
        if (this.messageContainer.scrollHeight - this.messageContainer.scrollTop - this.messageContainer.clientHeight < 100) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
        // Remove the first message if there are more than 1000 messages
        if (this.messageContainer.children.length > 1000) this.messageContainer.removeChild(this.messageContainer.firstChild);
    }
}

export default Terminal;