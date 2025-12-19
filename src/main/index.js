import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1260,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0b1021',
    title: 'Quick API Client',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev
    }
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
};

const sendAppEvent = (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.webContents.send('app-accelerator', event);
};

const buildMenu = () => {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }]
          }
        ]
      : []),
    {
      label: 'Actions',
      submenu: [
        {
          label: 'Send Request',
          accelerator: 'CommandOrControl+Enter',
          click: () => sendAppEvent('send-request')
        },
        {
          label: 'Add to Bulk Queue',
          accelerator: 'CommandOrControl+Shift+B',
          click: () => sendAppEvent('add-to-bulk')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createWindow();
  buildMenu();

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

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('open-external', (_event, target) => shell.openExternal(target));
