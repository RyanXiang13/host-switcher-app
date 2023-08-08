// The following executes in a render process before its web contents start to load.
// preload is attached to the main process (see main.js webPreferences)

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,  
  // we can also expose variables, not just functions
});

contextBridge.exposeInMainWorld('electronAPI', {
    loadFolder: (path) => ipcRenderer.invoke('loadFolder', path),
    copyFile: (oldPath) => ipcRenderer.send('copyFile', oldPath),
    readFile: (path, fileName) => ipcRenderer.invoke('readFile', path, fileName),
    getFiles: (callback) => ipcRenderer.on('readDirectory', callback),
    getOS: (callback) => ipcRenderer.on('OS', callback)
})
