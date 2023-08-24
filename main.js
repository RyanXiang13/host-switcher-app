const { app, BrowserWindow, ipcMain, Menu, screen, Tray, nativeImage} = require('electron'); // get required modules to load windows and communicate with renderer process
const path = require('path'); // get node path module
const fs = require('fs'); // get node file system module for windows OS file changes
const cp = require('child_process'); // get node child processes to execute shell commands

/*
const ignored1 = /node_modules|[/\\]\./;
const ignored2 = /temp|[/\\]\./; 
const ignored3 = /HostMaster[/\\]\./;

// Module for live reloading and updating 
// changes to app on save

const electronReload = require('electron-reload'); // module to automatically reload electron app on save

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe'),
    ignored: [ignored1, ignored2, ignored3],
    hardResetMethod: 'exit'
})
*/

/* Load all files in Host Master folder */
var fileNames = []; 

// if there are special instructions for loading, reading, or copying files
// on mac and linux, set the functions differently
// i.e. if (process.platform === 'darwin')
// loadFolder = async function() {
//  ...
// }
async function loadFolder() {};
async function readFile() {};
async function copyFile() {};

var newPath; // initialize local hosts file path variable

// set local hosts file path based on operating system
if (process.platform === 'win32') {
  newPath = 'C:/Windows/System32/drivers/etc/hosts';
}
else if (process.platform === 'darwin') {
  newPath = '/private/etc/hosts';
}
else if (process.platform === 'linux') {
  newPath = '/etc/hosts';
}

// asynchronous load folder function using fs node module
loadFolder = async function(path) { 
  // try catch to prevent runtime error
  try {
    fileNames = fs.readdirSync(path, (err, files) => { // read directory synchronously so all files load at once
      if (err) {
          console.log(err);
      }
      else {
          files.forEach(file => {
            fileNames.push(file);  // add all files read to an array
          })
      }
    })
    return fileNames; // return an array of all files
  } catch (err) { 
      console.log(err);
  }
}

/* Function that reads the file contents
and returns a string representation*/

readFile = async function(path, fileName) {
  const filePath = path+'/'+fileName; // store absolute path of the file to be read
  // try catch to prevent runtime errors
  try {
    return fs.readFileSync(filePath, 'utf-8'); // read contents of file synchronously
  } catch (err) {
    console.log(err);
    return 'Error while reading contents.\nEnsure you have selected a file and not a folder!'
  }
}

/*
Copy a file to a new path
given an old path and new path
*/
copyFile = async function(oldPath) {
  // Copying the file to a the same name
  fs.copyFile(oldPath, newPath, (err) => { // copy the file selected to local hosts file
    if (err) {
      console.log("Error Found: ", err);
    }
  });
}

/*
  The following commented-out code is in case 
    the node file system module does not work
    properly on mac or linux os
    They use the node child process module and
    run shell commands to load, read, and copy
    the desired directories and files

if (process.platform === 'darwin') {
  // Run copy file command on Mac OS
  loadFolder = async function() {
    cp.exec('ls')
  }
  // Using exec to copy file in shell
  copyFile = async function(oldPath, newPath) {
    cp.exec('copy '+oldPath+' '+newPath, (error, stdout, stderr) => {
      if (error) {
        console.log('error: '+error);
        return;
      }
      console.log('Output: '+stdout);
      console.log('Error: '+stderr);
    })
  }
}

// Run read file command on Linux
// Use exec to return contents of file
async function readFileShell(fileName) {
  cp.exec('cat '+fileName, (error, stdout, stderr) => {
    if (error) {
      console.log(error)
      return;
    }
    console.log('Output: '+stdout);
    console.log('Error: '+stderr);
  })
}
*/

let tray = null // initialize variable tray to null

/* 
  Initialize browser window with
    - pre-set dimensions
    - preload.js path
    - extra node module access
    - application icon
    - hidden property until app is ready
*/

const createWindow = (width, height) => {

  const mainWindow = new BrowserWindow({ // Renderer process instance
    width: width,
    height: height,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),       
        nodeIntegration: true
    },
    show: false,
    icon: './images/icon.png'
  })
  
  // Open devtools
  // mainWindow.webContents.openDevTools();
  
  /*  Menu customization if additional features were to be added,
      such as a refresh or editing button */  
  
  const menu = Menu.buildFromTemplate([]); // menu editing
  Menu.setApplicationMenu(menu);

  // Renderer to main function call
  ipcMain.on('copyFile', (event, oldPath) => { // code block executes when the parameter is passed through the 'copyFile' channel
    copyFile(oldPath); // call copyFile function and insert parameter
  });
  
  mainWindow.webContents.on('did-finish-load', function () { // wait until the page is ready to send the message    
    mainWindow.webContents.send('readDirectory', fileNames); // send fileNames array through the 'readDirectory' channel
    mainWindow.webContents.send('OS', process.platform); // send the OS name through the 'OS' channel
   });
  mainWindow.loadFile('index.html'); // Renderer process entrypoint
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show(); // show the window only when every part of the window is built and loaded
  })

  mainWindow.on('close', event => {
    event.preventDefault(); // save user's app information where they left off when hiding to tray
    mainWindow.hide(); // hide window
  })

  // if tray is not yet initialized, initialize a tray
  if (!tray) {
    const trayicon = nativeImage.createFromPath('./images/icon.png'); // keep tray icon as the desktop icon
    tray = new Tray(trayicon.resize({ width: 16 })); // set tray icon dimensions
    // initialize a menu for tray
    const contextMenu = Menu.buildFromTemplate([ // one menu option (to quit)
      {
        label: 'Quit',
        click: () => {
          tray.destroy(); // destroys the tray icon
          app.quit() // quit the app
        }
      }
    ])

    tray.setContextMenu(contextMenu); // set the context meny, including labels and on click functions

    tray.on('click', (event) => { // on click event for the tray icon
      mainWindow.show(); // show/unhide the main window
    })
  }
}

// App is done loading
app.whenReady().then(() => {

  ipcMain.handle('readFile', async (event, path, fileName) => { // two-way (renderer to main, main to renderer) to obtain file contents
    const result = await readFile(path, fileName); // await for return of read file
    return result; // return to renderer.js
  });

  ipcMain.handle('loadFolder', async (event, path) => { // two-way (renderer to main, main to renderer) to obtain array of all filenames
    const result = loadFolder(path); // await for return of array
    return result; // return to renderer.js
  });

  // We cannot require the screen module until the app is ready.
  const { screen } = require('electron'); // acquire screen module

  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay(); // get main window
  const { width, height } = primaryDisplay.workAreaSize; // set main window to fill up screen (for the best app view, can be changed)
  
  createWindow(width, height); // create main window (should only be done once)
})

// all app windows are closed
app.on('window-all-closed', () => {
  // mandatory handler
  // empty function because of tray icon
})
