const connectButton = document.getElementById('connect-serial');
const statusEl = document.getElementById('serial-status');
const firmwareInput = document.getElementById('firmwareInput');

firmwareInput.onclick = async (event) => {
    const filePath = await window.electronAPI.openFile([{ name: 'Compressed', extensions: ['zip'] }], ['openFile', 'dontAddToRecent']);
    console.log('Firmware loaded:', filePath);
    statusEl.innerText = `Selected firmware: ${filePath}`;
    const result = await window.electronAPI.flashEsp(filePath);
    if (result === true) {
        statusEl.innerText += `\nFirmware flashed successfully.`;
    } else {
        statusEl.innerText += `\nFirmware flashing failed with code: ${result}`;
    }
};