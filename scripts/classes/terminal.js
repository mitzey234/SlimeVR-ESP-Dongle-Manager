class Terminal {
    /** @type {import("./manager").default} */
    manager;

    /** @type {import("./serialDevice").default} */
    device;

    element = document.createElement('div');

    messageContainer = document.createElement('div');

    inputContainer = document.createElement('div');

    scrollToBottomButton = document.createElement('button');

    get scrolledToBottom() {
        return this.messageContainer.scrollHeight - this.messageContainer.scrollTop - this.messageContainer.clientHeight < 100;
    }

    /**
     * 
     * @param {import("./manager").default} manager 
     * @param {import("./serialDevice").default} device 
     */
    constructor(manager, device) {
        this.manager = manager;
        this.device = device;
        this.element.classList.add('h-full', 'w-full', 'bg-black/75', 'flex', 'flex-col', 'relative');

        //Message container
        this.messageContainer.classList.add('flex-1', 'overflow-y-auto', 'px-2', 'hideScrolls');
        this.element.appendChild(this.messageContainer);

        //Input container
        this.inputContainer.classList.add('flex', 'px-2', 'py-1', "flex-row");
        let icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-terminal', 'text-xl', 'text-white/50', 'mr-2', 'self-center');
        this.inputContainer.appendChild(icon);
        this.input = document.createElement('input');
        this.input.classList.add('w-full', 'bg-black/50', 'bg-transparent', 'border-none', 'rounded', 'text-white', 'py-1', 'focus:outline-none', 'focus:ring-0', "text-sm");
        this.input.type = "text";
        this.input.placeholder = "Type a command and press Enter to send it to the dongle...";
        this.inputContainer.appendChild(this.input);
        this.element.appendChild(this.inputContainer);

        //Scroll to bottom button
        this.scrollToBottomButton.classList.add('absolute', 'bottom-12', 'right-4', 'bg-blue-500', 'hover:bg-blue-600', 'text-white', 'rounded-full', 'w-10', 'h-10', 'flex', 'items-center', 'justify-center', 'shadow-lg', 'transition-all', 'duration-200', 'opacity-0', 'pointer-events-none', "cursor-pointer", "select-none");
        this.scrollToBottomButton.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
        this.scrollToBottomButton.addEventListener('click', () => {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        });
        this.element.appendChild(this.scrollToBottomButton);

        //Update button visibility on scroll
        this.messageContainer.addEventListener('scroll', () => {
            this.updateScrollButtonVisibility();
        });

        this.input.addEventListener('keydown', async (e) => {
            if (e.key === "Enter" && this.input.value.trim() !== "") {
                let command = this.input.value.trim();
                this.input.value = "";
                let result = await this.manager.sendCommand(command);
                if (!result) {
                    this.addMessage("Failed to send command to the dongle");
                } else this.addMessage("> " + command);
            }
        });

        manager.element.appendChild(this.element);
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
        if (this.scrolledToBottom) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
        // Remove the first message if there are more than 1000 messages
        if (this.messageContainer.children.length > 1000) this.messageContainer.removeChild(this.messageContainer.firstChild);
        
        // Update scroll button visibility after adding a message
        this.updateScrollButtonVisibility();
    }

    updateScrollButtonVisibility() {
        const scrollHeight = this.messageContainer.scrollHeight;
        const clientHeight = this.messageContainer.clientHeight;
        const scrollTop = this.messageContainer.scrollTop;
        
        // Check if there's enough content to scroll
        const hasScrollableContent = scrollHeight > clientHeight;
        
        // Check if we're more than 100px from the bottom
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const shouldShow = hasScrollableContent && distanceFromBottom > 100;
        
        if (shouldShow) {
            this.scrollToBottomButton.classList.remove('opacity-0', 'pointer-events-none');
            this.scrollToBottomButton.classList.add('opacity-100', 'pointer-events-auto');
        } else {
            this.scrollToBottomButton.classList.remove('opacity-100', 'pointer-events-auto');
            this.scrollToBottomButton.classList.add('opacity-0', 'pointer-events-none');
        }
    }
}

export default Terminal;