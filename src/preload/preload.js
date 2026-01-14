const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  makeRequest: (data) => ipcRenderer.invoke('make-request', data),
});
