class Manager {
    /** @type {import("./main.js")["default"]["prototype"]} */
    main;    

    /** @type {import("./serialDevice.js")["default"]["prototype"]} */
    device;

    element = document.createElement('div');

    constructor(main, device) {
        this.main = main;
        this.device = device;
        this.element.classList.add('flex', 'flex-row', 'items-center', 'justify-center', 'h-full', 'w-full', "hidden", "bg-black/50", "backdrop-blur-xl", "rounded-lg");
        this.main.contentContainerElement.appendChild(this.element);
    }
}

export default Manager;