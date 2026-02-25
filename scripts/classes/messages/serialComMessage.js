class SerialComMessage {
    head = 0;

    type;

    /** @type Array<number> */
    data;

    /**
     * @param {Array<number>} data 
     */
    constructor(data) {
        this.data = data;
        this.dataAsString = String.fromCharCode(...data);
    }
    
    /**
     * Read a length-prefixed string from the buffer
     * @returns {string}
     */
    readString() {
        let str = "";
        let length = this.data[this.head++];
        if (this.data.length < this.head + length) throw new Error("Not enough data to read string");
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(this.data[this.head++]);
        }
        return str;
    }

    /**
     * Read an unsigned 8-bit integer
     * @returns {number}
     */
    readUInt8() {
        if (this.data.length < this.head + 1) {
            throw new Error("Not enough data to read UInt8");
        }
        return this.data[this.head++];
    }

    /**
     * Read an unsigned 16-bit integer (little-endian)
     * @returns {number}
     */
    readUInt16() {
        if (this.data.length < this.head + 2) {
            throw new Error("Not enough data to read UInt16");
        }
        const byte0 = this.data[this.head++];
        const byte1 = this.data[this.head++];
        return byte0 | (byte1 << 8);
    }

    /**
     * Read a signed 8-bit integer
     * @returns {number}
     */
    readInt8() {
        if (this.data.length < this.head + 1) {
            throw new Error("Not enough data to read Int8");
        }
        const value = this.data[this.head++];
        // Convert unsigned to signed
        return value > 127 ? value - 256 : value;
    }

    /**
     * Read a signed 16-bit integer (little-endian)
     * @returns {number}
     */
    readInt16() {
        if (this.data.length < this.head + 2) {
            throw new Error("Not enough data to read Int16");
        }
        const byte0 = this.data[this.head++];
        const byte1 = this.data[this.head++];
        const value = byte0 | (byte1 << 8);
        // Convert unsigned to signed
        return value > 32767 ? value - 65536 : value;
    }

    /**
     * Read a boolean value
     * @returns {boolean}
     */
    readBool() {
        if (this.data.length < this.head + 1) {
            throw new Error("Not enough data to read Bool");
        }
        return this.data[this.head++] !== 0;
    }

    /**
     * Read a MAC address (6 bytes) and format as a string
     * @returns {string} MAC address formatted as "AA:BB:CC:DD:EE:FF"
     */
    readMacAddress() {
        if (this.data.length < this.head + 6) {
            throw new Error("Not enough data to read MAC address");
        }
        const mac = [];
        for (let i = 0; i < 6; i++) {
            const byte = this.data[this.head++];
            mac.push(byte.toString(16).toUpperCase().padStart(2, '0'));
        }
        return mac.join(':');
    }

    /**
     * Read a Tracker object
     * @returns {{mac: string, trackerId: number, missedPings: number, latency: number, rssi: number}}
     */
    readTracker() {
        const mac = this.readMacAddress();
        const trackerId = this.readUInt8();
        const missedPings = this.readUInt8();
        const latency = this.readUInt8();
        const rssi = this.readInt8();
        
        return {
            mac,
            trackerId,
            missedPings,
            latency,
            rssi
        };
    }

    readPairedTracker() {
        const mac = this.readMacAddress();
        const trackerId = this.readUInt8();

        return {
            mac,
            trackerId
        };
    }
}

export default SerialComMessage;