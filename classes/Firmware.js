const fs = require('fs');
const path = require('path');
const temporaryFolder = path.join(require('os').tmpdir(), 'slimevr-esp-dongle-manager', "decompressed_firmwares");
const unzip = require('unzipper');

class Firmware {
    bootloaderOffset = 0;
    partitionsOffset = 32768;
    firmwareOffset = 65536;

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

        // Check uncompressed size before extracting (protect against zip bombs)
        console.log('Checking archive size...');
        const maxUncompressedSize = 100 * 1024 * 1024; // 100MB
        
        try {
            const directory = await unzip.Open.file(this.compressedPath);
            let totalUncompressedSize = 0;
            let fileCount = 0;
            for (const file of directory.files) {
                totalUncompressedSize += file.uncompressedSize;
                fileCount++;
                if (totalUncompressedSize > maxUncompressedSize) {
                    throw new Error(`Archive exceeds maximum size: ${(totalUncompressedSize / 1024 / 1024).toFixed(2)}MB > 100MB`);
                } else if (fileCount > 1000) {
                    throw new Error(`Archive contains too many files: ${fileCount} > 1000`);
                }
            }
        } catch (error) {
            console.error('Archive check failed:', error.message);
            return -8;
        }

        // Extract the archive
        let stream = fs.createReadStream(this.compressedPath).pipe(unzip.Extract({ path: this.path }));
        console.log('Decompressing...');
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
                this.bootloaderOffset = offsets['bootloader.bin'] ?? this.bootloaderOffset;
                this.partitionsOffset = offsets['partitions.bin'] ?? this.partitionsOffset;
                this.firmwareOffset = offsets['firmware.bin'] ?? this.firmwareOffset;
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

        if (Object.keys(this.files).length === 0) {
            console.error('No valid firmware files found in the archive.');
            return -6;
        }

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

        //If no firmware.bin is present, we can't flash, so return an error
        if (!this.files['firmware.bin']) {
            console.error('No firmware.bin found in the archive, cannot proceed with flashing.');
            return -7;
        }
        return true;
    }
}

module.exports = Firmware;