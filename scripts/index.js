let loadingText = document.getElementById('loadingText');
let Main;

let loadingTimeout = setTimeout(loadingTimeoutFunction, 15000);
let overlay = document.getElementById('overlay');
let loadingMessages = ["Spinning Gears...", "Loading Modules...", "Almost There...", "Just a Moment...", "Preparing the Magic...", "Warming Up the ESPs...", "Calibrating the Dongle...", "Summoning the Code..."];

document.getElementById('reloadLink').addEventListener('click', () => {
    location.reload();
});


loadingText.innerText = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
setInterval(() => {
    loadingText.innerText = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}, 5000);

(async () => {
    Main = (await import("./classes/main.js")).default;
    let main = new Main();
    await main.waitForReady();
    setTimeout(function () {
        overlay.classList.remove("draggable");
        overlay.classList.add("opacity-0", "pointer-events-none");
    }, await main.electronAPI.DEBUG() ? 500 : 1000);
    console.log('Core class ready:', main);
    clearTimeout(loadingTimeout);
    document.getElementById('loadingTooLongText').classList.add('hidden');
})();

function loadingTimeoutFunction() {
    document.getElementById('loadingTooLongText').classList.remove('hidden');
}


async function flash (event) {
    const filePath = await window.electronAPI.openFile([{ name: 'Compressed', extensions: ['zip'] }], ['openFile', 'dontAddToRecent']);
    console.log('Firmware loaded:', filePath);
    statusEl.innerText = `Selected firmware: ${filePath}`;
    const result = await window.electronAPI.readFirmwareArchive(filePath);
    console.log('Firmware read result:', result);
    if (typeof result === 'number') {
        statusEl.innerText = `Error reading firmware: ${result}`;
    } else {
        statusEl.innerText = `Firmware loaded successfully: ${result.files.length} files found.`;
    }

    const esploaderMod = window.esptoolPackage;
    let esploader;

    let ports = await navigator.serial.getPorts();
    let port = ports[0];
    if (!port) {
        errorMsg('No serial ports found. Please connect your ESP device and try again.');
        return;
    }
    try {
        await port.open({ baudRate: 115200 });
    } catch (err) {
        errorMsg('Failed to open serial port:', err);
        return;
    }

    // Only open if not already open (requestSerialPort may return an opened port)
    if (!port.readable || !port.writable) {
        await port.open({ baudRate: ESP_ROM_BAUD });
    }

    console.log('[Connect] Using Web Serial for Desktop');
    esploader = new window.esptoolPackage.ESPLoader(port, {
        log: (...args) => logMsg(...args),
        debug: (...args) => debugMsg(...args),
        error: (...args) => errorMsg(...args),
    });

    try {
        await esploader.initialize();
    } catch (err) {
        // If ESP32-S2 reconnect is in progress (handled by event listener), suppress the error
        if (esp32s2ReconnectInProgress) {
            logMsg("Initialization interrupted for ESP32-S2 reconnection.");
            return;
        }

        // Not ESP32-S2 or other error
        try {
            await esploader.disconnect();
        } catch (disconnectErr) {
            // Ignore disconnect errors
        }
        throw err;
    }

    logMsg("Connected to " + esploader.chipName);
    logMsg("MAC Address: " + formatMacAddr(esploader.macAddr()));

    // Store chip info globally
    currentChipName = esploader.chipName;
    currentMacAddr = formatMacAddr(esploader.macAddr());

    espStub = await esploader.runStub();

    // Set detected flash size in the read size field
    if (espStub.flashSize) {
        const flashSizeBytes = parseFlashSize(espStub.flashSize);
        logMsg(`Detected flash size: ${espStub.flashSize} (${flashSizeBytes} bytes)`);
    }

    // Set the selected baud rate
    await espStub.setBaudrate(921600);

    // Store disconnect handler so we can remove it later
    const handleDisconnect = () => {
        logMsg("Device disconnected");
        espStub = false;
    };
    espStub.handleDisconnect = handleDisconnect; // Store reference on espStub
    espStub.addEventListener("disconnect", handleDisconnect);
    
    for (let i in result.files) {
        let file = result.files[i];
        logMsg(`File: ${i}, Offset: ${file.offset}`, file);
        let offsetOverride;
        if (i == "bootloader.bin") offsetOverride = espStub.getBootloaderOffset();
        await espStub.flashData(file.data, (bytesWritten, totalBytes) => logMsg(bytesWritten, totalBytes), offsetOverride || file.offset, true);
    }

    await espStub.enterConsoleMode();
};