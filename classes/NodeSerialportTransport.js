/**
 * Wrapper class around Node Serialport API to communicate with the serial device.
 * @param {Object} portInfo - PortInfo object from SerialPort.list()
 * @param {string} portInfo.path - Serial port path (e.g., 'COM3' or '/dev/ttyUSB0')
 * @param {string} [portInfo.manufacturer] - Device manufacturer
 * @param {string} [portInfo.serialNumber] - Device serial number
 * @param {string} [portInfo.pnpId] - PnP ID
 * @param {string} [portInfo.locationId] - Location ID
 * @param {string} [portInfo.friendlyName] - Friendly name
 * @param {string} [portInfo.vendorId] - USB Vendor ID (hex string)
 * @param {string} [portInfo.productId] - USB Product ID (hex string)
 *
 * ```
 * const ports = await SerialPort.list();
 * const transport = new Transport(ports[0]);
 * await transport.connect(115200);
 * ```
 */
class Transport {
    constructor(portInfo, tracing = false, enableSlipReader = true) {
        this.portInfo = portInfo;
        this.device = null;
        this.tracing = tracing;
        this.slipReaderEnabled = false;
        this.baudrate = 0;
        this.traceLog = "";
        this.lastTraceTime = Date.now();
        this.buffer = new Uint8Array(0);
        this.SLIP_END = 0xc0;
        this.SLIP_ESC = 0xdb;
        this.SLIP_ESC_END = 0xdc;
        this.SLIP_ESC_ESC = 0xdd;
        this._DTR_state = false;
        this.slipReaderEnabled = enableSlipReader;
        this.dataCallback = null;
    }
    /**
     * Request the serial device vendor ID and Product ID as string.
     * @returns {string} Return the device VendorID and ProductID from SerialPortInfo as formatted string.
     */
    getInfo() {
        const { vendorId, productId, friendlyName, path } = this.portInfo;
        if (vendorId && productId) {
            return `Serial VendorID 0x${vendorId} ProductID 0x${productId} ${friendlyName || path}`;
        }
        return `Serial ${friendlyName || path}`;
    }
    /**
     * Request the serial device product id from SerialPortInfo.
     * @returns {number | undefined} Return the product ID.
     */
    getPid() {
        return this.portInfo.productId ? parseInt(this.portInfo.productId, 16) : undefined;
    }
    /**
     * Format received or sent data for tracing output.
     * @param {string} message Message to format as trace line.
     */
    trace(message) {
        if (!this.tracing) return;
        const delta = Date.now() - this.lastTraceTime;
        const prefix = `TRACE ${delta.toFixed(3)}`;
        const traceMessage = `${prefix} ${message}`;
        console.log(traceMessage);
        this.traceLog += traceMessage + "\n";
    }
    async returnTrace() {
        try {
            await navigator.clipboard.writeText(this.traceLog);
            console.log("Text copied to clipboard!");
        }
        catch (err) {
            console.error("Failed to copy text:", err);
        }
    }
    hexify(s) {
        return Array.from(s)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
            .padEnd(16, " ");
    }
    hexConvert(uint8Array, autoSplit = true) {
        if (autoSplit && uint8Array.length > 16) {
            let result = "";
            let s = uint8Array;
            while (s.length > 0) {
                const line = s.slice(0, 16);
                const asciiLine = String.fromCharCode(...line)
                    .split("")
                    .map((c) => (c === " " || (c >= " " && c <= "~" && c !== "  ") ? c : "."))
                    .join("");
                s = s.slice(16);
                result += `\n    ${this.hexify(line.slice(0, 8))} ${this.hexify(line.slice(8))} | ${asciiLine}`;
            }
            return result;
        }
        else {
            return this.hexify(uint8Array);
        }
    }
    /**
     * Format data packet using the Serial Line Internet Protocol (SLIP).
     * @param {Uint8Array} data Binary unsigned 8 bit array data to format.
     * @returns {Uint8Array} Formatted unsigned 8 bit data array.
     */
    slipWriter(data) {
        const outData = [];
        outData.push(0xc0);
        for (let i = 0; i < data.length; i++) {
            if (data[i] === 0xdb) {
                outData.push(0xdb, 0xdd);
            }
            else if (data[i] === 0xc0) {
                outData.push(0xdb, 0xdc);
            }
            else {
                outData.push(data[i]);
            }
        }
        outData.push(0xc0);
        return new Uint8Array(outData);
    }
    /**
     * Write binary data to device using Node Serialport.
     * @param {Uint8Array} data 8 bit unsigned data array to write to device.
     */
    async write(data) {
        console.log('Writing data to serial port:', data);
        const outData = this.slipWriter(data);
        if (this.device && this.device.isOpen) {
            if (this.tracing) {
                console.log("Write bytes");
                this.trace(`Write ${outData.length} bytes: ${this.hexConvert(outData)}`);
            }
            return new Promise((resolve, reject) => {
                this.device.write(Buffer.from(outData), (err) => {
                    console.log('Data write callback from serial port:', err);
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Drain the write buffer to ensure data is sent before continuing
                    this.device.drain((drainErr) => {
                        if (drainErr) reject(drainErr);
                        else resolve();
                    });
                });
                this.device.drain((drainErr) => {
                    if (drainErr) reject(drainErr);
                    else resolve();
                });
            });
        }
    }
    /**
     * Append a buffer array after another buffer array
     * @param {Uint8Array} arr1 - First array buffer.
     * @param {Uint8Array} arr2 - magic hex number to select ROM.
     * @returns {Uint8Array} Return a 8 bit unsigned array.
     */
    appendArray(arr1, arr2) {
        const combined = new Uint8Array(arr1.length + arr2.length);
        combined.set(arr1);
        combined.set(arr2, arr1.length);
        return combined;
    }
    // Wait for data to be available in buffer
    async waitForData(minBytes, timeout) {
        const startTime = Date.now();
        
        if (this.tracing) {
            this.trace(`Waiting for ${minBytes} bytes (buffer has ${this.buffer.length} bytes), timeout ${timeout}ms`);
        }
        
        // Use a promise-based approach with data event listener
        return new Promise((resolve, reject) => {
            const checkBuffer = () => {
                if (this.buffer.length >= minBytes) {
                    if (this.tracing) {
                        this.trace(`Buffer ready: ${this.buffer.length} >= ${minBytes} bytes`);
                    }
                    resolve();
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                if (elapsed > timeout) {
                    if (this.tracing) {
                        this.trace(`Read timeout after ${elapsed}ms, buffer has ${this.buffer.length}/${minBytes} bytes`);
                    }
                    reject(new Error("Read timeout exceeded"));
                    return;
                }
                
                // Check again soon
                setTimeout(checkBuffer, 10);
            };
            
            checkBuffer();
        });
    }
    // Read a specific number of bytes
    async newRead(numBytes, timeout) {
        if (numBytes > 0) {
            await this.waitForData(numBytes, timeout);
        }
        
        const output = this.buffer.slice(0, numBytes);
        this.buffer = this.buffer.slice(numBytes);
        return output;
    }
    async flushInput() {
        if (!this.device) return;
        return new Promise((resolve, reject) => {
            this.device.flush((err) => {
                if (err) reject(err);
                else {
                    this.buffer = new Uint8Array(0);
                    resolve();
                }
            });
        });
    }
    async flushOutput() {
        if (!this.device) return;
        return new Promise((resolve, reject) => {
            this.device.drain((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    // `inWaiting` returns the count of bytes in the buffer
    inWaiting() {
        return this.buffer.length;
    }
    /**
     * Detect if the data read from device is a Fatal or Guru meditation error.
     * @param {Uint8Array} input Data read from device
     */
    detectPanicHandler(input) {
        const guruMeditationRegex = /G?uru Meditation Error: (?:Core \d panic'ed \(([a-zA-Z ]*)\))?/;
        const fatalExceptionRegex = /F?atal exception \(\d+\): (?:([a-zA-Z ]*)?.*epc)?/;
        const inputString = new TextDecoder("utf-8").decode(input);
        const match = inputString.match(guruMeditationRegex) || inputString.match(fatalExceptionRegex);
        if (match) {
            const cause = match[1] || match[2];
            const msg = `Guru Meditation Error detected${cause ? ` (${cause})` : ""}`;
            throw new Error(msg);
        }
    }
    /**
     * Take a data array and return the first well formed packet after
     * replacing the escape sequence. Reads at least 8 bytes.
     * @param {number} timeout Timeout read data.
     * @yields {Uint8Array} Formatted packet using SLIP escape sequences.
     */
    async *read(timeout) {
        let partialPacket = null;
        let isEscaping = false;
        let successfulSlip = false;
        while (true) {
            const waitingBytes = this.inWaiting();
            const readBytes = await this.newRead(waitingBytes > 0 ? waitingBytes : 1, timeout);
            if (!readBytes || readBytes.length === 0) {
                const msg = partialPacket === null
                    ? successfulSlip
                        ? "Serial data stream stopped: Possible serial noise or corruption."
                        : "No serial data received."
                    : `Packet content transfer stopped`;
                this.trace(msg);
                throw new Error(msg);
            }
            this.trace(`Read ${readBytes.length} bytes: ${this.hexConvert(readBytes)}`);
            let i = 0; // Track position in readBytes
            while (i < readBytes.length) {
                const byte = readBytes[i++];
                if (partialPacket === null) {
                    if (byte === this.SLIP_END) {
                        partialPacket = new Uint8Array(0); // Start of a new packet
                    }
                    else {
                        this.trace(`Read invalid data: ${this.hexConvert(readBytes)}`);
                        const remainingData = await this.newRead(this.inWaiting(), timeout);
                        this.trace(`Remaining data in serial buffer: ${this.hexConvert(remainingData)}`);
                        this.detectPanicHandler(new Uint8Array([...readBytes, ...(remainingData || [])]));
                        throw new Error(`Invalid head of packet (0x${byte.toString(16)}): Possible serial noise or corruption.`);
                    }
                }
                else if (isEscaping) {
                    isEscaping = false;
                    if (byte === this.SLIP_ESC_END) {
                        partialPacket = this.appendArray(partialPacket, new Uint8Array([this.SLIP_END]));
                    }
                    else if (byte === this.SLIP_ESC_ESC) {
                        partialPacket = this.appendArray(partialPacket, new Uint8Array([this.SLIP_ESC]));
                    }
                    else {
                        this.trace(`Read invalid data: ${this.hexConvert(readBytes)}`);
                        const remainingData = await this.newRead(this.inWaiting(), timeout);
                        this.trace(`Remaining data in serial buffer: ${this.hexConvert(remainingData)}`);
                        this.detectPanicHandler(new Uint8Array([...readBytes, ...(remainingData || [])]));
                        throw new Error(`Invalid SLIP escape (0xdb, 0x${byte.toString(16)})`);
                    }
                }
                else if (byte === this.SLIP_ESC) {
                    isEscaping = true;
                }
                else if (byte === this.SLIP_END) {
                    this.trace(`Received full packet: ${this.hexConvert(partialPacket)}`);
                    this.buffer = this.appendArray(this.buffer, readBytes.slice(i));
                    yield partialPacket;
                    partialPacket = null;
                    successfulSlip = true;
                }
                else {
                    partialPacket = this.appendArray(partialPacket, new Uint8Array([byte]));
                }
            }
        }
    }
    /**
     * Read from serial device without slip formatting.
     * @yields {Uint8Array} Raw data chunks.
     */
    async *rawRead() {
        while (true) {
            await this.waitForData(1, 3000);
            const value = this.buffer;
            this.buffer = new Uint8Array(0);
            
            if (this.tracing) {
                console.log("Raw Read bytes");
                this.trace(`Read ${value.length} bytes: ${this.hexConvert(value)}`);
            }
            yield value;
        }
    }
    /**
     * Send the RequestToSend (RTS) signal to given state
     * # True for EN=LOW, chip in reset and False EN=HIGH, chip out of reset
     * @param {boolean} state Boolean state to set the signal
     */
    async setRTS(state) {
        if (!this.device) return;
        return new Promise((resolve, reject) => {
            this.device.set({ rts: state }, (err) => {
                if (err) reject(err);
                else {
                    // Work-around for adapters on Windows
                    this.setDTR(this._DTR_state).then(resolve).catch(reject);
                }
            });
        });
    }
    /**
     * Send the dataTerminalReady (DTR) signal to given state
     * # True for IO0=LOW, chip in reset and False IO0=HIGH
     * @param {boolean} state Boolean state to set the signal
     */
    async setDTR(state) {
        this._DTR_state = state;
        if (!this.device) return;
        return new Promise((resolve, reject) => {
            this.device.set({ dtr: state }, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    /**
     * Connect to serial device using Node Serialport.
     * @param {number} baud Number baud rate for serial connection. Default is 115200.
     * @param {object} serialOptions Serial Options for Node SerialPort.
     */
    async connect(baud = 115200, serialOptions = {}) {
        const { SerialPort } = require('serialport');
        
        return new Promise((resolve, reject) => {
            this.device = new SerialPort({
                path: this.portInfo.path,
                baudRate: baud,
                dataBits: serialOptions.dataBits || 8,
                stopBits: serialOptions.stopBits || 1,
                parity: serialOptions.parity || 'none',
                autoOpen: false
            });

            this.device.open((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.baudrate = baud;
                
                // Set up data listener
                this.device.on('data', (data) => {
                    const uint8Data = new Uint8Array(data);
                    if (this.tracing) {
                        console.log('Raw data received from serial port');
                        this.trace(`Received ${uint8Data.length} bytes into buffer: ${this.hexConvert(uint8Data)}`);
                    }
                    this.buffer = this.appendArray(this.buffer, uint8Data);
                    if (this.dataCallback) {
                        this.dataCallback(uint8Data);
                    }
                });

                this.device.on('error', (err) => {
                    console.error('Serial port error:', err);
                });

                resolve();
            });
        });
    }
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Wait for a given timeout ms for serial device unlock.
     * @param {number} timeout Timeout time in milliseconds (ms) to sleep
     */
    async waitForUnlock(timeout) {
        while ((this.device.readable && this.device.readable.locked) ||
            (this.device.writable && this.device.writable.locked)) {
            await this.sleep(timeout);
        }
    }
    /**
     * Disconnect from serial device by running SerialPort.close().
     */
    async disconnect() {
        if (!this.device) return;
        
        return new Promise((resolve, reject) => {
            if (this.device.isOpen) {
                this.device.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Transport;