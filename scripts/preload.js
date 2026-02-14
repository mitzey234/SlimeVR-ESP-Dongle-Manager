const { contextBridge, ipcRenderer } = require('electron');

(async () => {
    const ElectronAPI = (await import('./scripts/classes/electronAPI.js')).default;
    new ElectronAPI(true, contextBridge, ipcRenderer);
})();

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
});

console.log('Preload script loaded.');