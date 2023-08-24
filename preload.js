// The following executes in a render process before its web contents start to load.
// preload is attached to the main process (see main.js webPreferences)

const { contextBridge, ipcRenderer } = require('electron'); // import two modules required for interporcess communication (IPC)

contextBridge.exposeInMainWorld('electronAPI', { // initialize context bridge called electronAPI
    loadFolder: (path) => ipcRenderer.invoke('loadFolder', path), // trigger load folder function in main and return array of files
    copyFile: (oldPath) => ipcRenderer.send('copyFile', oldPath), // trigger copy file function in main
    readFile: (path, fileName) => ipcRenderer.invoke('readFile', path, fileName), // trigger read file function in main and return file contents
    getOS: (callback) => ipcRenderer.on('OS', callback) // get the operating system string from main
})
