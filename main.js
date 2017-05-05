//Q

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
var mainWindow = null;

const path = require('path')
const url = require('url')

app.on('ready', function(){
    mainWindow = new BrowserWindow({
        width: 612,
        height: 384
    });
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true
    }))
    mainWindow.on('closed', function () {
        mainWindow = null
    })
})

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