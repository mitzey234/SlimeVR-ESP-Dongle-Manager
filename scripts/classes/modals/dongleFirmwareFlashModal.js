import Modal from "./modal.js";
import Translations from "../FirmwareTranslations.js";

class DongleFirmwareFlashModal extends Modal {

    set skews(skews) {
        this.clearAll();
        for (const skew of skews) {
            let filename = skew;
            let name = Translations[skew] ?? this.toHumanFriendlySkewName(filename);
            this.addSkew(name, filename);
        }
    }

    toHumanFriendlySkewName(filename) {
        const normalizedFilename = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
        if (normalizedFilename.length === 0) return filename;
        return normalizedFilename
            .split(/\s+/)
            .map(word => {
                if (/^esp\d+[a-z0-9]*$/i.test(word) || /^s\d+$/i.test(word)) return word.toUpperCase();
                if (/^[A-Z0-9]+$/.test(word)) {
                    if (/^[A-Z]{1,3}$/.test(word)) return word;
                    let formattedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    return formattedWord.replace(/(\d+)([a-z])/g, (_, digits, letter) => `${digits}${letter.toUpperCase()}`);
                }
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }

    /**
     * @param {Array<string>} releases
     */
    set releases(releases) {
        this.clearAllReleases();
        for (const release of releases) this.addRelease(release);
    }

    get selectedRelease() {
        return this.releaseSelector.value;
    }

    set selectedRelease(value) {
        this.releaseSelector.value = value;
        this.manager.main.electronAPI.getAvailableFiles(value).then(files => {
            this.skews = files;
        }).catch(err => {
            console.error('Error getting available files:', err);
            this.close();
            this.manager.warning.confirm("Failed to get available firmware files", "An error occurred while fetching the available firmware files for this release (" + value + "): " + err.message, "OK", true);
        });
    }

    get selectedSkew() {
        let skewElements = Array.from(this.firmwareSkewContainer.children);
        let selectedElement = skewElements.find(el => el.classList.contains('bg-blue-500/50'));
        return selectedElement ? selectedElement.dataset.filename : null;
    }

    set selectedSkew(filename) {
        if (filename === this.selectedSkew) return;
        let skewElements = Array.from(this.firmwareSkewContainer.children);
        for (const el of skewElements) {
            if (el.dataset.filename === filename) {
                el.classList.add('bg-blue-500/50', "pointer-events-none");
                el.classList.remove('bg-neutral-800', 'hover:bg-neutral-700', 'active:bg-neutral-700');
            } else {
                el.classList.remove('bg-blue-500/50', "pointer-events-none");
                el.classList.add('bg-neutral-800', 'hover:bg-neutral-700', 'active:bg-neutral-700');
            }
        }
        this.confirmButton.classList.toggle('hidden', filename == null);
    }

    constructor(manager) {
        super(manager);

        this.element.classList.add('flex', 'flex-col', 'gap-4');

        const releaseSelectorContainer = document.createElement('div');
        releaseSelectorContainer.classList.add('flex', 'items-center', 'justify-between', 'gap-4');
        this.element.appendChild(releaseSelectorContainer);

        this.titleElement = document.createElement('h2');
        this.titleElement.classList.add('text-lg', 'font-bold');
        this.titleElement.innerText = 'Select device board';
        releaseSelectorContainer.appendChild(this.titleElement);

        this.releaseSelector = document.createElement('select');
        this.releaseSelector.classList.add('bg-neutral-800', 'hover:bg-neutral-700', 'text-white', 'px-3', 'py-2', 'rounded', 'border', 'border-neutral-700', 'focus:border-blue-500', 'focus:outline-none', 'cursor-pointer', 'transition', 'duration-200', 'ease-in-out');
        this.releaseSelector.addEventListener('change', () => {
            this.selectedRelease = this.releaseSelector.value;
        });
        releaseSelectorContainer.appendChild(this.releaseSelector);

        this.firmwareSkewContainer = document.createElement('div');
        this.firmwareSkewContainer.classList.add('flex', 'flex-col', 'gap-2', 'max-h-[75%]', 'overflow-y-auto', 'overflow-x-hidden', "hideScrolls");
        this.element.appendChild(this.firmwareSkewContainer);

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('flex', 'justify-end');
        this.element.appendChild(buttonContainer);

        this.confirmButton = document.createElement('button');
        this.confirmButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', 'cursor-pointer', 'hidden');
        this.confirmButton.innerText = 'Confirm';
        this.confirmButton.addEventListener('click', async () => {
            let firmware = await this.manager.main.electronAPI.getFirmwareArchive(this.selectedRelease, this.selectedSkew);
            if (typeof firmware === 'number') {
                let errorMessage = "An unknown error occurred while fetching the firmware archive: " + firmware;
                if (firmware === -1) {
                    errorMessage = "Error removing existing temporary firmware directory";
                } else if (firmware === -2) {
                    errorMessage = "Error creating temporary firmware directory";
                } else if (firmware === -3) {
                    errorMessage = "File not found or inaccessible";
                } else if (firmware === -4) {
                    errorMessage = "Error during firmware decompression";
                } else if (firmware === -5) {
                    errorMessage = "Error reading offsets.json";
                } else if (firmware === -6) {
                    errorMessage = "No valid firmware files found in the archive";
                } else if (firmware === -7) {
                    errorMessage = "The archive contains no firmware.bin file";
                } else if (firmware === -8) {
                    errorMessage = "Either the archive is too large, contains too many files, or isn't valid";
                }
                this.close();
                this.manager.warning.confirm("Failed to load firmware archive", errorMessage, "OK", true);
                return;
            }
            this.close();
            this.manager.customFirmwareModal.open();
            this.manager.customFirmwareModal.flashType = 1;
            this.manager.customFirmwareModal.firmware = firmware;
            await this.manager.customFirmwareModal.flash();
        });
        buttonContainer.appendChild(this.confirmButton);
    }

    async open() {
        super.open();
        this.selectedSkew = null;
        this.skews = [];
        this.releases = [];
        let releases = await this.manager.main.electronAPI.getAvailableReleases();
        this.releases = releases;
        if (releases.length > 0 && releases.includes(this.manager.main.firmwareVersion)) this.selectedRelease = this.manager.main.firmwareVersion;
        else if (releases.length > 0) this.selectedRelease = releases[0].value;
        else {
            this.close();
            this.manager.warning.confirm("No firmware releases found", "No firmware releases were found for your device. Please check back later.", "OK", true);
        }
    }

    addRelease(name, value = name) {
        const optionElement = document.createElement('option');
        optionElement.value = value;
        optionElement.innerText = name;
        this.releaseSelector.appendChild(optionElement);
    }

    addSkew(name, filename) {
        const skewElement = document.createElement('button');
        skewElement.classList.add('w-full', 'flex', 'flex-col', 'items-start', 'justify-center', 'border', 'border-neutral-700', 'rounded', 'p-4', 'cursor-pointer', 'bg-neutral-800', 'hover:bg-neutral-700', 'active:bg-neutral-700', 'transition', 'duration-200', 'ease-in-out', 'text-white', 'text-left');

        const nameElement = document.createElement('span');
        nameElement.classList.add('font-medium');
        nameElement.innerText = name;
        skewElement.appendChild(nameElement);

        const filenameElement = document.createElement('span');
        filenameElement.classList.add('text-xs', 'text-white/70');
        filenameElement.innerText = filename;
        skewElement.appendChild(filenameElement);

        skewElement.dataset.filename = filename;

        skewElement.addEventListener('click', () => {
            this.selectedSkew = filename;
        });
        this.firmwareSkewContainer.appendChild(skewElement);
    }

    clearAll() {
        this.firmwareSkewContainer.innerHTML = '';
    }

    clearAllReleases() {
        this.releaseSelector.innerHTML = '';
    }
}

export default DongleFirmwareFlashModal;