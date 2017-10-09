//Q
//Main.js - Copyright Ben Constable 2017

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
var mainWindow = null;


const Store = require('electron-store');
const store = new Store();

const path = require('path');
const url = require('url');

app.on('ready', function(){
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720
    });
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