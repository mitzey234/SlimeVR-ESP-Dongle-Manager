const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron/main');
const path = require('node:path');
const Firmware = require('./classes/Firmware.js');
const inspector = require('inspector');

function isInspectorRunning() {
  return inspector.url() !== undefined;
}

function isDebuggerAttached() {
  const execArgv = process.argv || [];
  const hasInspectFlag = execArgv.some((arg) =>
    arg.startsWith('--inspect') ||
    arg.startsWith('--inspect-brk') ||
    arg.startsWith('--remote-debugging-port') ||
    arg.startsWith('--debug')
  );

  return hasInspectFlag || isInspectorRunning();
}

const DEBUG = isDebuggerAttached();

if (DEBUG) console.log('Debugger detected, enabling debug mode');

Menu.setApplicationMenu(null);

function createWindow() {
  const mainWindow = new BrowserWindow({
    titleBarStyle: "hidden",
    width: 1600,
    height: 1000,
    minWidth: 1080,
    minHeight: 600,
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
  if (DEBUG) mainWindow.webContents.openDevTools()
  return mainWindow;
}

async function handleFileOpen(event, filters, properties) {
  const { canceled, filePaths } = await dialog.showOpenDialog({ filters: filters, properties: properties })
  if (!canceled) {
    return filePaths[0]
  }
}

async function readFirmwareArchive(event, firmwarePath) {
  let firmware = new Firmware(firmwarePath);
  let parseResult = await firmware.parse();
  if (parseResult !== true) {
    console.error('Firmware parsing failed with code:', parseResult);
    return parseResult;
  }
  return firmware;
}

app.whenReady().then(() => {
  let window = createWindow();

  ipcMain.handle('dialog:openFile', handleFileOpen)

  ipcMain.handle('firmware:readArchive', readFirmwareArchive)

  ipcMain.handle('window:minimize', () => {
    window.minimize();
  })

  ipcMain.handle('window:maximize', () => {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  })

  ipcMain.handle('app:version', () => {
    return app.getVersion();
  })

  ipcMain.handle('window:close', () => {
    window.close();
  })

  ipcMain.handle('window:devTools', () => {
    window.webContents.isDevToolsOpened() ? window.webContents.closeDevTools() : window.webContents.openDevTools();
  });

  ipcMain.handle('app:update', () => {
    // Placeholder for update logic
    console.log('Update button clicked');
  });

  ipcMain.handle('app:checkForUpdates', async () => {
    // Placeholder for check for updates logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async update check
    console.log('Check for updates triggered');
  });

  ipcMain.handle('app:DEBUG', () => {
    return DEBUG;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})