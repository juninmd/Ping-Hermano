const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  makeRequest: (data) => ipcRenderer.invoke('make-request', data),
  cancelRequest: (requestId) => ipcRenderer.invoke('cancel-request', requestId),
  getFilePath: (file) => webUtils.getPathForFile(file)
});
