const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow
let url = 'https://pdis.github.io/socialinnovationlab-calendar/monitor'

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600})
  mainWindow.setFullScreen(true);
  mainWindow.loadURL(url)

  // mainWindow.webContents.openDevTools()
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

function reload() {
    if(mainWindow != null){
        mainWindow.webContents.loadURL(url)
    }
}

setInterval(reload,1000*60*60);
