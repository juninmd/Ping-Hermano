const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { handleRequest, cancelRequest } = require('./requestHandler');

const isDev = process.env.npm_lifecycle_event === 'dev' || process.env.npm_lifecycle_event === 'dev:electron';

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // In production, the build output is in dist/
    // src/main/main.js -> ../../dist/index.html
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('make-request', async (event, requestData) => {
    return await handleRequest(requestData);
});

ipcMain.handle('cancel-request', async (event, requestId) => {
    return cancelRequest(requestId);
});
