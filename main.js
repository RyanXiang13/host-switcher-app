const { app, BrowserWindow, ipcMain, Menu, screen} = require('electron'); // get required modules to load windows and communicate with renderer process
const path = require('path'); // get node path module
const fs = require('fs'); // get node file system module for windows OS file changes
const cp = require('child_process'); // get node child processes to execute shell commands

// const ignored1 = /node_modules|[/\\]\./;
// const ignored2 = /temp|[/\\]\./; 
// const ignored3 = /HostMaster[/\\]\./;

/*  Module for live reloading and updating 
    changes to app on save 

const electronReload = require('electron-reload'); // module to automatically reload electron app on save

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe'),
    ignored: [ignored1, ignored2, ignored3],
    hardResetMethod: 'exit'
})
*/

/* Load all files in Host Master folder */
var fileNames = [];
var fileNamesString = [];
async function loadFolder() {};
async function readFile() {};
async function copyFile() {};

var newPath;

if (process.platform === 'win32') {
  newPath = 'C:/Windows/System32/Drivers/etc/hosts';
}
else if (process.platform === 'darwin') {
  newPath = '/private/etc/hosts';
}
else if (process.platform === 'linux') {
  newPath = '/etc/hosts';
}

loadFolder = async function(path) { 
  console.log(path);
  try {
    fileNames = fs.readdirSync(path, (err, files) => {
      if (err) {
          console.log(err);
      }
      else {
          files.forEach(file => {
            fileNames.push(file);  
          })
      }
    })
    console.log(fileNames);
    return fileNames;
  } catch (err) {
      console.log(err);
  }
}

/* Function that reads the file contents
and returns a string representation*/

readFile = async function(path, fileName) {
  const filePath = path+'/'+fileName;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.log(err);
  }
}

/*
Copy a file to a new path
given an old path and new path
*/
copyFile = async function(oldPath) {
  // Copying the file to a the same name
  fs.copyFile(oldPath, newPath, (err) => {
    if (err) {
      console.log("Error Found: ", err); 
    }
    else { 
      // Get the current filenames
      // after the function
      console.log("success");
    }
  });
}

/*
  The following commented out code is in case 
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
    mainWindow.show()
  })
  // Open devtools
  //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('readFile', async (event, path, fileName) => {
    const result = await readFile(path, fileName);
    return result;
  });

  ipcMain.handle('loadFolder', async (event, path) => {
    const result = loadFolder(path);
    return result;
  });

  // We cannot require the screen module until the app is ready.
  const { screen } = require('electron');

  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  createWindow(width, height);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
        }
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});
