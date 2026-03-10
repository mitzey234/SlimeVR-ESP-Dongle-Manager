import Modal from "./modal.js";

class CustomFirmwareFlashModal extends Modal {

    /** @type {import('../serialManager.js').default} */
    manager;

    // 1 = Flash from Zip, 2 = Flash Manually
    _flashType;
    get flashType() {
        return this._flashType;
    }

    set flashType(value) {
        if (this._flashType === value) return;
        this._flashType = value;
        this.optionsContainer.classList.toggle('hidden', value != null);
        if (value == null) this.warningContainer.classList.add("hidden");
        this.manualFlashContainer.classList.toggle('hidden', value !== 2);
    }

    _firmware;
    get firmware() {
        return this._firmware;
    }

    set firmware(value) {
        if (this._firmware === value) return;
        this._firmware = value;
        this.clearFiles();
        this.fileProgressContainer.classList.toggle('hidden', !value);
        this.flashButton.classList.toggle('hidden', !value);
        if (value) {
            for (const fileName in value.files) {
                const file = value.files[fileName];
                this.addFile(fileName, file.data.length, file.offset);
            }
        } else {
            this.warningContainer.classList.add("hidden");
        }
    }

    _fileData;

    get fileData() {
        return this._fileData;
    }

    set fileData(value) {
        if (this._fileData === value) return;
        this._fileData = value;
        if (value) {
            this.selectFileButton.innerText = value.name;
        } else {
            this.selectFileButton.innerText = "Select file";
        }
    }

    fileMap = new Map();

    constructor(manager) {
        super(manager);
        this.manager = manager;
        this.element.classList.add('bg-gray-800', 'rounded', 'p-6', 'flex', 'flex-col', 'gap-6');
        
        //Display two card options horizontally: Flash from Compressed Firmware Zip, Flash manually
        let optionsContainer = document.createElement('div');
        optionsContainer.classList.add('flex', 'space-x-4', 'justify-center', "select-none");
        this.element.appendChild(optionsContainer);
        this.optionsContainer = optionsContainer;

        this.flashZipOption = document.createElement('div');
        this.flashZipOption.classList.add('w-52', 'h-64', 'flex', 'flex-col', 'items-center', 'justify-center', 'border', 'border-neutral-700', 'rounded', 'p-4', 'cursor-pointer', 'hover:bg-neutral-700', 'transition', 'duration-200', 'ease-in-out');
        let flashZipIcon = document.createElement('i');
        flashZipIcon.classList.add('fa-regular', 'fa-file-zipper', 'text-4xl', 'mb-4');
        this.flashZipOption.appendChild(flashZipIcon);
        let flashZipTitle = document.createElement('h3');
        flashZipTitle.classList.add('text-lg', 'font-bold', 'mb-2', "text-center");
        flashZipTitle.innerText = "Flash from Compressed Firmware Zip";
        this.flashZipOption.appendChild(flashZipTitle);
        let flashZipDesc = document.createElement('p');
        flashZipDesc.classList.add('text-sm', 'text-center', "text-white/70");
        flashZipDesc.innerText = "Select a .zip file containing the firmware and offsets.json";
        this.flashZipOption.appendChild(flashZipDesc);
        this.flashZipOption.addEventListener('click', async () => {
            if (this.selectingFileLock) return;
            this.selectingFileLock = true;
            this.errorMessage.classList.add('hidden'); 
            let result = await this.manager.main.electronAPI.openFile([{ name: 'Compressed', extensions: ['zip'] }], ['openFile', 'dontAddToRecent']);
            this.selectingFileLock = false;
            if (result == null) return;
            let firmware = await this.manager.main.electronAPI.readFirmwareArchive(result);
            if (typeof firmware === "number") {
                let errorMessage = "An unknown error occurred while reading the firmware archive: " + firmware;
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
                this.errorMessage.innerText = errorMessage;
                this.errorMessage.classList.remove('hidden');
                return;
            }
            if (this.manager.device.name.indexOf("ESP32") == -1) {
                //If the device is not an ESP32 and the bootloader.bin and partitions.bin files are not present, set the firmware.bin offset to 0
                if (!firmware.files['bootloader.bin'] && firmware.files['partitions.bin']) {
                    firmware.files['firmware.bin'].offset = 0;
                }
            }
            this.firmware = firmware;
            this.flashType = 1;
        });
        optionsContainer.appendChild(this.flashZipOption);

        this.flashManualOption = document.createElement('div');
        this.flashManualOption.classList.add('w-52', 'h-64', 'flex', 'flex-col', 'items-center', 'justify-center', 'border', 'border-neutral-700', 'rounded', 'p-4', 'cursor-pointer', 'hover:bg-neutral-700', 'transition', 'duration-200', 'ease-in-out');
        let flashManualIcon = document.createElement('i');
        flashManualIcon.classList.add('fa-solid', 'fa-microchip', 'text-4xl', 'mb-4');
        this.flashManualOption.appendChild(flashManualIcon);
        let flashManualTitle = document.createElement('h3');
        flashManualTitle.classList.add('text-lg', 'font-bold', 'mb-2', "text-center");
        flashManualTitle.innerText = "Flash Manually";
        this.flashManualOption.appendChild(flashManualTitle);
        let flashManualDesc = document.createElement('p');
        flashManualDesc.classList.add('text-sm', 'text-center', "text-white/70");
        flashManualDesc.innerText = "Use the manual flashing interface to select firmware and offsets";
        this.flashManualOption.appendChild(flashManualDesc);
        this.flashManualOption.addEventListener('click', () => {
            //TODO: Implement manual flashing interface
            this.errorMessage.classList.add('hidden');
            this.flashType = 2;
        });
        optionsContainer.appendChild(this.flashManualOption);

        //File progress container
        this.fileProgressContainer = document.createElement('div');
        this.fileProgressContainer.classList.add("flex", "flex-col", "gap-2", 'hidden');
        this.element.appendChild(this.fileProgressContainer);

        //Error message container
        this.errorMessage = document.createElement('div');
        this.errorMessage.classList.add('text-red-500', 'text-sm', 'text-center', 'p-5', 'hidden', 'bg-red-900/50', 'rounded', 'border', 'border-red-700');
        this.element.appendChild(this.errorMessage);

        //Manual file selection elements (only shown if flashType == 2)
        this.manualFlashContainer = document.createElement('div');
        this.manualFlashContainer.classList.add('flex', 'flex-row', 'gap-2', 'items-center', 'hidden');
        this.element.appendChild(this.manualFlashContainer);

        this.selectFileButton = document.createElement('button');
        this.selectFileButton.classList.add('bg-gray-600', 'hover:bg-gray-700', 'active:bg-gray-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', 'cursor-pointer');
        this.selectFileButton.innerText = "Select file";
        this.selectFileButton.addEventListener('click', async () => {
            if (this.selectingFileLock) return;
            this.selectingFileLock = true;
            this.errorMessage.classList.add('hidden');
            let result = await this.manager.main.electronAPI.openFile([{ name: 'Binary File', extensions: ['bin'] }], ['openFile']);
            this.selectingFileLock = false;
            if (result == null) return;
            let fileData;
            try {
                fileData = await this.manager.main.electronAPI.readFile(result);
            } catch (err) {
                this.errorMessage.innerText = err.message;
                this.errorMessage.classList.remove('hidden');
                return;
            }
            this.fileData = fileData;
        });
        this.manualFlashContainer.appendChild(this.selectFileButton);

        let offsetLabel = document.createElement('label');
        offsetLabel.classList.add('text-sm', 'text-white/70');
        offsetLabel.innerText = "Offset:";
        this.manualFlashContainer.appendChild(offsetLabel);

        this.offsetInput = document.createElement('input');
        this.offsetInput.type = 'number';
        this.offsetInput.classList.add('bg-gray-700', 'text-white', 'px-3', 'py-2', 'rounded', 'w-32', 'border', 'border-gray-600', 'focus:border-blue-500', 'focus:outline-none');
        this.offsetInput.placeholder = '0x0';
        this.offsetInput.value = '0';
        this.manualFlashContainer.appendChild(this.offsetInput);

        this.addFileButton = document.createElement('button');
        this.addFileButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', 'cursor-pointer', 'ml-auto');
        this.addFileButton.innerText = "Add File";
        this.addFileButton.addEventListener('click', () => {
            if (!this.fileData) return;
            let offsetValue = parseInt(this.offsetInput.value);
            if (isNaN(offsetValue) || offsetValue < 0) {
                this.errorMessage.innerText = "Invalid offset value";
                this.errorMessage.classList.remove('hidden');
                return;
            }
            let fileName = this.fileData.name;
            let firmware = this.firmware;
            if (!firmware) firmware = { files: {} };
            else this.addFile(fileName, this.fileData.data.length, offsetValue);
            firmware.files[fileName] = { data: this.fileData.data, offset: offsetValue, size: this.fileData.data.length };
            this.firmware = firmware;
            this.fileData = null;
        });
        this.manualFlashContainer.appendChild(this.addFileButton);

        //Do not disconnect warning
        let warningContainer = document.createElement('div');
        warningContainer.classList.add('flex', 'flex-row', 'items-center', 'gap-2', 'text-yellow-500', 'text-sm', "hidden");
        let warningIcon = document.createElement('i');
        warningIcon.classList.add('fa-solid', 'fa-triangle-exclamation');
        warningContainer.appendChild(warningIcon);
        let warningText = document.createElement('span');
        warningText.innerText = "Do not disconnect or close the application during flashing";
        warningContainer.appendChild(warningText);
        this.element.appendChild(warningContainer);
        this.warningContainer = warningContainer;

        //Flash and Cancel buttons
        let buttonContainer = document.createElement('div');
        buttonContainer.classList.add('flex', 'flex-row', 'justify-start');
        this.element.appendChild(buttonContainer);

        this.cancelButton = document.createElement('button');
        this.cancelButton.classList.add('bg-gray-500', 'hover:bg-gray-700', 'active:bg-gray-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer");
        this.cancelButton.innerText = "Cancel";
        this.cancelButton.onclick = () => {
            this.cancel();
        };
        buttonContainer.appendChild(this.cancelButton);

        this.flashButton = document.createElement('button');
        this.flashButton.classList.add('ml-auto', 'bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer");
        this.flashButton.innerText = "Flash";
        this.flashButton.onclick = () => {
            this.flash();
        };
        buttonContainer.appendChild(this.flashButton);
    }

    async flash () {
        this.flashButton.classList.add("hidden");
        this.cancelButton.classList.add("hidden");
        this.warningContainer.classList.remove("hidden");
        this.manualFlashContainer.classList.add("hidden");
        //Disable delete button on all the file elements to prevent deletion during flashing
        for (let entry of this.fileMap.values()) entry.deleteButton.classList.add("hidden");
        if (this.firmware == null || this.flashType == null) return;
        for (let i in this.firmware.files) {
            let file = this.firmware.files[i];
            let entry = this.fileMap.get(i);
            entry.progressBarContainer.classList.remove('hidden');
            try {
                await this.manager.espStub.flashData(file.data, (bytesWritten, totalBytes) => {
                    let progress = bytesWritten / totalBytes;
                    entry.progressBar.style.width = `${(progress * 100).toFixed(2)}%`;
                }, file.offset, true);
            } catch (error) {
                console.error(`Error flashing file ${i}:`, error);
                this.errorMessage.innerText = `Error flashing file ${i}: ${error.message}`;
                this.errorMessage.classList.remove('hidden');
                this.warningContainer.classList.add("hidden");
                return;
            }
            entry.progressBarContainer.classList.add('hidden');
            entry.fileElement.classList.add('opacity-30');
        }
        this.warningContainer.classList.add("hidden");
        this.reset();
        this.locked = false;
        this.close();
    }

    clearFiles () {
        this.fileProgressContainer.innerHTML = "";
        this.fileMap.clear();
    }

    addFile (name, size, offset) {
        let fileElement = document.createElement('div');
        fileElement.classList.add('flex', 'flex-row', 'items-center', 'gap-4');
        let fileIcon = document.createElement('i');
        fileIcon.classList.add('fa-solid', 'fa-file', 'text-2xl');
        fileElement.appendChild(fileIcon);
        let textContainer = document.createElement('div');
        textContainer.classList.add('flex', 'flex-col', "w-full", "gap-1");
        fileElement.appendChild(textContainer);
        let fileName = document.createElement('span');
        fileName.classList.add('text-lg', 'font-medium', "leading-none");
        fileName.innerText = name;
        textContainer.appendChild(fileName);
        let fileSubtext = document.createElement('span');
        fileSubtext.classList.add('text-sm', 'text-white/70', "leading-none");
        fileSubtext.innerText = `Size: ${(size / 1024).toFixed(2)}KB | Offset: 0x${offset.toString(16)}`;
        textContainer.appendChild(fileSubtext);
        let progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('w-full', 'h-2', 'bg-neutral-700', 'rounded', 'overflow-hidden', "hidden");
        let progressBar = document.createElement('div');
        progressBar.classList.add('h-full', 'bg-blue-500', 'w-0');
        progressBarContainer.appendChild(progressBar);
        textContainer.appendChild(progressBarContainer);
        
        // Delete button (only shown in manual mode)
        let deleteButton = document.createElement('button');
        deleteButton.classList.add('bg-red-600', 'hover:bg-red-700', 'active:bg-red-800', 'text-white', 'px-3', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', 'cursor-pointer');
        if (this.flashType !== 2) {
            deleteButton.classList.add('hidden');
        }
        let deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fa-solid', 'fa-trash');
        deleteButton.appendChild(deleteIcon);
        deleteButton.addEventListener('click', () => {
            // Remove from firmware.files
            if (this.firmware && this.firmware.files) {
                delete this.firmware.files[name];
                // Check if no files remain
                if (Object.keys(this.firmware.files).length === 0) {
                    this.firmware = null;
                }
            }
            // Remove from fileMap
            this.fileMap.delete(name);
            // Remove element from DOM
            fileElement.remove();
        });
        fileElement.appendChild(deleteButton);
        
        this.fileProgressContainer.appendChild(fileElement);
        this.fileMap.set(name, {size, progressBar, fileElement, progressBarContainer, deleteButton});
    }

    reset() {
        this.flashType = null;
        this.firmware = null;
        this.fileData = null;
        this.cancelButton.classList.remove("hidden");
        this.errorMessage.classList.add('hidden');
    }

    cancel () {
        this.locked = false;
        this.close();
        this.reset();
    }

    open() {
        this.reset();
        super.open();
        this.locked = true;
    }

    
    onClose() {
        
    }
}

export default CustomFirmwareFlashModal;