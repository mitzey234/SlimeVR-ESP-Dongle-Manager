const { app, BrowserWindow, dialog, ipcMain } = require('electron/main');
const path = require('node:path');
const Firmware = require('./classes/Firmware.js');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "scripts", 'preload.js')
    }
  })

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial' && details.securityOrigin === 'file:///') {
      return true
    }

    return false
  })

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial' && details.origin === 'file://') {
      return true
    }

    return false
  })

  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()
}

async function handleFileOpen(event, filters, properties) {
  const { canceled, filePaths } = await dialog.showOpenDialog({ filters: filters, properties: properties })
  if (!canceled) {
    return filePaths[0]
  }
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.handle('dialog:openFile', handleFileOpen)

  ipcMain.handle('firmware:readArchive', readFirmwareArchive)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

async function readFirmwareArchive(event, firmwarePath) {
  let firmware = new Firmware(firmwarePath);
  let parseResult = await firmware.parse();
  if (parseResult !== true) {
    console.error('Firmware parsing failed with code:', parseResult);
    return parseResult;
  }
  return firmware;
}