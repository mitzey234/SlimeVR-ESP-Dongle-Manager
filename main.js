const { app, BrowserWindow, dialog, ipcMain, Menu, autoUpdater } = require('electron/main');
const path = require('node:path');
const fs = require('node:fs');
const Firmware = require('./classes/Firmware.js');
const inspector = require('inspector');
const FirmwareUpdate = require('./classes/FirmwareUpdate.js');

let updater = new FirmwareUpdate(app);

var handleStartupEvent = function() {
  if (process.platform !== 'win32') {
    return false;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':

      // Optionally do things such as:
      //
      // - Install desktop and start menu shortcuts
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Always quit when done
      app.quit();

      return true;
    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Always quit when done
      app.quit();

      return true;
    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      app.quit();
      return true;
  }
};

handleStartupEvent();
if (handleStartupEvent()) return;

const server = "https://slimevr-dongle-manager-deployer.vercel.app";
const url = `${server}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })

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

const windowStateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(windowStateFile)) {
      const data = fs.readFileSync(windowStateFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  return {
    width: 1600,
    height: 1000
  };
}

function saveWindowState(window) {
  try {
    const bounds = window.getBounds();
    fs.writeFileSync(windowStateFile, JSON.stringify(bounds), 'utf8');
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

function createWindow() {
  const windowState = loadWindowState();
  
  const mainWindow = new BrowserWindow({
    titleBarStyle: "hidden",
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1080,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "scripts", 'preload.js')
    }
  })
  
  // Save window state when it's resized or moved
  let saveTimeout;
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
        saveWindowState(mainWindow);
      }
    }, 500);
  };
  
  mainWindow.on('resize', debouncedSave);
  mainWindow.on('move', debouncedSave)

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

let checkingForUpdates = false;
var updateInfo = null;
/** @type {Array<{resolve: Function, reject: Function}>} */
let updateHooks = [];

autoUpdater.on('update-downloaded', (e, notes, name, date, url) => {
  let obj = {e, notes, name, date, url};
  console.log('Update available:', obj);
  updateInfo = obj;
  updateHooks.forEach(hook => hook.resolve(obj));
  updateHooks = [];
  checkingForUpdates = false;
});

autoUpdater.on('error', (e) => {
  console.log('Error while updating:', e);
  updateHooks.forEach(hook => hook.reject(e));
  updateHooks = [];
  checkingForUpdates = false;
});

autoUpdater.on('update-not-available', (e) => {
  console.log('No updates available');
  updateHooks.forEach(hook => hook.resolve(null));
  updateHooks = [];
  checkingForUpdates = false;
});

app.whenReady().then(async () => {
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

  ipcMain.handle('app:checkForUpdates', async () => {
    // Placeholder for check for updates logic
    if (!app.isPackaged) return null;
    if (updateInfo != null) return updateInfo;
    let prom = new Promise((resolve, reject) => {
      updateHooks.push({ resolve, reject });
    });
    if (!checkingForUpdates) {
      console.log('Checking for updates...');
      checkingForUpdates = true;
      autoUpdater.checkForUpdates();
    }
    try {
      return await prom;
    } catch (e) {
      console.error('Error while checking for updates:', e);
      return e;
    }
  });

  ipcMain.handle('app:update', () => {
    if (updateInfo) {
      autoUpdater.quitAndInstall();
    } else {
      console.log('No update info available, cannot install update');
    }
  });

  ipcMain.handle('app:DEBUG', () => {
    return DEBUG;
  });

  ipcMain.handle('file:read', async (event, filePath) => {
    try {
      const size = fs.statSync(filePath).size;
      if (size > 50 * 1024 * 1024) throw new Error(`File is too large to read: ${(size / 1024 / 1024).toFixed(2)}MB > 50MB`);
      const data = fs.readFileSync(filePath);
      return { name: path.basename(filePath), size, data };
    } catch (err) {
      console.error('Error reading file:', err);
      throw err;
    }
  });

  ipcMain.handle('app:checkForFirmwareUpdates', async () => {
    try {
      const result = await updater.checkForUpdates();
      return result;
    } catch (err) {
      console.error('Error checking for firmware updates:', err);
      return { error: err.message };
    }
  });

  ipcMain.handle('app:getAvailableFiles', (event, tag) => {
    try {
      const files = updater.getAvailableFiles(tag);
      return files;
    } catch (err) {
      console.error('Error getting available files:', err);
      return { error: err.message };
    }
  });

  ipcMain.handle('app:getFirmwareArchive', async (event, tag, board) => {
    try {
      const archive = await updater.getFirmwareArchive(tag, board);
      return archive;
    } catch (err) {
      console.error('Error getting firmware archive:', err);
      return { error: err.message };
    }
  });

  ipcMain.handle('app:getAvailableReleases', async (event) => {
    try {
      const releases = await updater.getAvailableReleases();
      return releases;
    } catch (err) {
      console.error('Error getting available releases:', err);
      return { error: err.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})