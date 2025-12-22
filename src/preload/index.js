import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('quickApi', {
  version: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onAppEvent: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('app-accelerator', listener);
    return () => ipcRenderer.removeListener('app-accelerator', listener);
  },
  onAppError: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('app-error', listener);
    return () => ipcRenderer.removeListener('app-error', listener);
  },
  sendRequest: (payload) => ipcRenderer.invoke('request:send', payload),
  clearCookies: () => ipcRenderer.invoke('cookies:clear')
});
