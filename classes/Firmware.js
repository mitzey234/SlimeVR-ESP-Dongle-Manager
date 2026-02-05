const fs = require('fs');
const path = require('path');
const temporaryFolder = path.join(require('os').tmpdir(), 'slimevr-esp-dongle-manager', "decompressed_firmwares");
const unzip = require('unzipper');

class Firmware {
    bootloaderOffset = 0;
    partitionsOffset = 4096;
    firmwareOffset = 16384;

    files = {};

    constructor(compressedPath) {
        this.compressedPath = compressedPath;
    }

    async parse() {
        this.path = path.join(temporaryFolder, path.parse(this.compressedPath).name);
        if (fs.existsSync(this.compressedPath) === false) {
            console.error('Firmware file does not exist:', this.compressedPath);
            return -3;
        }

        if (fs.existsSync(this.path)) {
            try {
                fs.rmSync(this.path, { recursive: true, force: true });
            } catch (error) {
                console.error('Error removing existing temporary firmware directory:', error);
                return -1;
            }
        }

        if (!fs.existsSync(temporaryFolder)) {
            try {
                fs.mkdirSync(temporaryFolder, { recursive: true });
            } catch (error) {
                console.error('Error creating temporary firmware directory:', error);
                return -2;
            }
        }

        // Simple unzip implementation
        let stream = fs.createReadStream(this.compressedPath).pipe(unzip.Extract({ path: this.path }));
        console.log('Decompressing firmware...');
        let completionPromise = new Promise((resolve, reject) => {
            stream.on('close', resolve);
            stream.on('error', reject);
        });
        try {
            await completionPromise;
        } catch (error) {
            console.error('Error during firmware decompression:', error);
            return -4;
        }
        console.log('Decompression complete.');

        if (fs.existsSync(path.join(this.path, 'offsets.json'))) {
            console.log('Found offsets.json, reading offsets from it.');
            let offsets;
            try {
                offsets = JSON.parse(fs.readFileSync(path.join(this.path, 'offsets.json'), 'utf-8'));
                this.bootloaderOffset = offsets['bootloader.bin'] || this.bootloaderOffset;
                this.partitionsOffset = offsets['partitions.bin'] || this.partitionsOffset;
                this.firmwareOffset = offsets['firmware.bin'] || this.firmwareOffset;
                delete offsets['bootloader.bin'];
                delete offsets['partitions.bin'];
                delete offsets['firmware.bin'];
                for (const [fileName, fileOffset] of Object.entries(offsets)) {
                    if (fs.existsSync(path.join(this.path, fileName))) this.files[fileName] = {path: path.join(this.path, fileName), offset: fileOffset};
                }
            } catch (error) {
                console.error('Error reading offsets.json:', error);
                return -5;
            }
        }

        if (fs.existsSync(path.join(this.path, 'bootloader.bin'))) this.files['bootloader.bin'] = {path: path.join(this.path, 'bootloader.bin'), offset: this.bootloaderOffset};
        if (fs.existsSync(path.join(this.path, 'partitions.bin'))) this.files['partitions.bin'] = {path: path.join(this.path, 'partitions.bin'), offset: this.partitionsOffset};
        if (fs.existsSync(path.join(this.path, 'firmware.bin'))) this.files['firmware.bin'] = {path: path.join(this.path, 'firmware.bin'), offset: this.firmwareOffset};

        for (let i in this.files) {
            let file = this.files[i];
            //Don't allow files greater than 10MB
            if (fs.statSync(file.path).size >= 10 * 1024 * 1024) {
                console.warn(`File ${i} is larger than 10MB, removing from file list for safety.`);
                delete this.files[i];
                file = this.files[i];
                if (!file) continue;
            }
            file.data = fs.readFileSync(file.path);
        }
        return true;
    }
}

module.exports = Firmware;