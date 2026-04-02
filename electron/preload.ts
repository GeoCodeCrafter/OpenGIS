import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filters?: Electron.FileFilter[]) =>
    ipcRenderer.invoke('dialog:openFile', filters),

  saveFile: (defaultPath: string, filters?: Electron.FileFilter[]) =>
    ipcRenderer.invoke('dialog:saveFile', defaultPath, filters),

  readFile: (path: string) =>
    ipcRenderer.invoke('fs:readFile', path),

  writeFile: (path: string, data: ArrayBuffer) =>
    ipcRenderer.invoke('fs:writeFile', path, data),

  readTextFile: (path: string) =>
    ipcRenderer.invoke('fs:readTextFile', path),

  writeTextFile: (path: string, content: string) =>
    ipcRenderer.invoke('fs:writeTextFile', path, content),

  getAppPath: () =>
    ipcRenderer.invoke('app:getPath'),

  showItemInFolder: (path: string) =>
    ipcRenderer.send('shell:showItemInFolder', path),

  platform: process.platform,
});
