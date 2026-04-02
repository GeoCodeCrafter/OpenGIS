import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'OpenGIS',
    icon: join(__dirname, '../assets/icons/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    backgroundColor: '#0f172a',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Inject Referer + User-Agent for map tile servers that require them (e.g. OSM).
  // Without a Referer, OSM and several other volunteer tile CDNs return HTTP 403.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://*/*', 'http://*/*'] },
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      // Only patch tile-like image requests that lack a Referer
      if (!headers['Referer'] && !headers['referer']) {
        headers['Referer'] = 'https://opengis.app/';
      }
      if (!headers['User-Agent'] || headers['User-Agent'].startsWith('Electron')) {
        headers['User-Agent'] = 'OpenGIS/0.1.0 (https://opengis.app)';
      }
      callback({ requestHeaders: headers });
    },
  );

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC Handlers ---

ipcMain.handle('dialog:openFile', async (_event, filters?: Electron.FileFilter[]) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters ?? [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'bmp'] },
      { name: 'GIS Files', extensions: ['geojson', 'json', 'gpx', 'kml', 'shp', 'csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_event, defaultPath: string, filters?: Electron.FileFilter[]) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: filters ?? [
      { name: 'GeoTIFF', extensions: ['tif', 'tiff'] },
      { name: 'PNG', extensions: ['png'] },
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
      { name: 'Project', extensions: ['ogproj'] },
    ],
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('fs:readFile', async (_event, path: string) => {
  const buffer = await readFile(path);
  return buffer.buffer;
});

ipcMain.handle('fs:writeFile', async (_event, path: string, data: ArrayBuffer) => {
  await writeFile(path, Buffer.from(data));
});

ipcMain.handle('fs:readTextFile', async (_event, path: string) => {
  return readFile(path, 'utf-8');
});

ipcMain.handle('fs:writeTextFile', async (_event, path: string, content: string) => {
  await writeFile(path, content, 'utf-8');
});

ipcMain.handle('app:getPath', async () => {
  return app.getPath('userData');
});

ipcMain.on('shell:showItemInFolder', (_event, path: string) => {
  shell.showItemInFolder(path);
});
