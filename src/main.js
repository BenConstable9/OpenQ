//OpenQ
//Main.js - Copyright Ben Constable 2017

const electron = require('electron');
const app = electron.app;
const {ipcMain} = electron;
const BrowserWindow = electron.BrowserWindow;
global.mainWindow = null;
global.external = null;

const path = require('path');
const url = require('url');

const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

app.on('ready', function(){
    mainWindow = new BrowserWindow({
        width: 1080,
        height: 720,
        icon: path.join(__dirname, 'app/img/icon.ico')
    });
    mainWindow.maximize();
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true
    }));
    mainWindow.on('closed', function () {
        mainWindow = null
    });
})

function ExternalScreen() {
    var electronScreen = electron.screen;
    var displays = electronScreen.getAllDisplays();
    var externalDisplay = null;
    for (var i in displays) {
        if (displays[i].bounds.x != 0 || displays[i].bounds.y != 0) {
          externalDisplay = displays[i];
          break;
        }
    }

    if (externalDisplay) {
        external = new BrowserWindow({
            x: externalDisplay.bounds.x + 50,
            y: externalDisplay.bounds.y + 50,
            icon: path.join(__dirname, 'app/img/icon.ico'),
            //fullscreen: true
            frame: false
        });
        external.maximize();
        external.loadURL(url.format({
            pathname: path.join(__dirname, 'app/external.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
}

// Listen for async message from renderer process
ipcMain.on('async', (event, arg) => {  
    console.log(arg);
    if (arg == "ExternalScreen") {
        ExternalScreen();
    }
});


app.on('window-all-closed', function () {
    //mac os
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})

autoUpdater.on('update-downloaded', (info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 5 seconds.
  // You could call autoUpdater.quitAndInstall(); immediately
  setTimeout(function() {
    autoUpdater.quitAndInstall();  
  }, 5000)
})

app.on('ready', function()  {
  autoUpdater.checkForUpdates();
});