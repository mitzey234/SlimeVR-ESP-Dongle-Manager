const { app, BrowserWindow, dialog, ipcMain } = require('electron/main');
const path = require('node:path');
const Firmware = require('./classes/Firmware.js');
const { SerialPort } = require('serialport');
const Transport = require("./classes/NodeSerialportTransport.js");
const crypto = require('crypto');
const { ESPLoader } = require('esptool-js');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "scripts", 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()
}

async function handleFileOpen (event, filters, properties) {
  const { canceled, filePaths } = await dialog.showOpenDialog({filters: filters, properties: properties})
  if (!canceled) {
    return filePaths[0]
  }
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.handle('dialog:openFile', handleFileOpen)

  ipcMain.handle('esp:flash', flashFirmware)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

let fileArray = [];
let progressBars = [];

async function flashFirmware(event, firmwarePath) {
    fileArray = [];
    progressBars = [];
    let firmware = new Firmware(firmwarePath);
    let parseResult = await firmware.parse();
    if (parseResult !== true) {
        console.error('Firmware parsing failed with code:', parseResult);
        return parseResult;
    }
    console.log('Firmware files to flash:', firmware.files);
    for (let i in firmware.files) {
        let file = firmware.files[i];
        if (!file) continue;
        // Convert Buffer to string for esptool-js bundle compatibility
        const dataString = file.data.toString('binary');
        fileArray.push({offset: file.offset, data: dataString});
    }
    start();
}

async function start () {
    if (!ESPLoader) {
        console.error('ESPLoader not loaded yet. Please wait...');
        return;
    }
    
    let ports = await SerialPort.list();
    var info = ports[1];
    if (!info) {
        console.error('No serial ports found.');
        return;
    }

    let esploader = new ESPLoader({
        transport: new Transport(info, true),
        terminal: undefined,
        debugLogging: true,
        enableTracing: true
    });

    let chip = await esploader.main();
    console.log('Connected to chip:', chip, esploader);

    let flashOptions = {
        fileArray: fileArray,
        eraseAll: false,
        compress: true,
        flashMode: "qio",
        flashFreq: "80000000",
        flashSize: "keep",
        reportProgress: (fileIndex, written, total) => {
            console.log(`Flashing file ${fileIndex}: ${written}/${total} bytes`);
            progressBars[fileIndex].value = (written / total) * 100;
        },
        calculateMD5Hash: (image) => {
            const latin1String = Array.from(image, (byte) => String.fromCharCode(byte)).join("");
            return crypto.createHash('md5').update(latin1String, 'latin1').digest('hex');
        }
    }
    await esploader.writeFlash(flashOptions);
    await esploader.after();
}