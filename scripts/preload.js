const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
contextBridge.exposeInMainWorld('webUtils', webUtils);

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filters, properties) => ipcRenderer.invoke('dialog:openFile', filters, properties),
  flashEsp: (firmwarePath) => ipcRenderer.invoke('esp:flash', firmwarePath)
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});

console.log('Preload script loaded.');