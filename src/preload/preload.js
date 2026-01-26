const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  makeRequest: (data) => ipcRenderer.invoke('make-request', data),
  getFilePath: (file) => webUtils.getPathForFile(file)
});
