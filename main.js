const { app, BrowserWindow, ipcMain, powerMonitor, dialog } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const { getAudio, setAudio } = require('./system-audio');

let mainWindow;
let statsWindow = null;

function createWindow() {
  // Pass DEV_MODE to renderer
  const isDevMode = process.env.DEV_MODE === 'true';
  global.DEV_MODE = isDevMode;

  console.log('[Main] DEV_MODE:', isDevMode);
  console.log('[Main] process.env.DEV_MODE:', process.env.DEV_MODE);

  mainWindow = new BrowserWindow({
    width: 400,
    height: 560,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: false,
    skipTaskbar: false,
    icon: path.join(__dirname, 'image', 'icon3.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: isDevMode ? ['--dev-mode'] : []
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in dev mode for debugging
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  }

  // Keep window always on top even when other windows are focused
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for system idle time
ipcMain.handle('get-idle-time', async () => {
  return powerMonitor.getSystemIdleTime();
});

// IPC handler for active window detection (YouTube)
ipcMain.handle('get-active-window', async () => {
  try {
    const window = await activeWin();
    return window;
  } catch (error) {
    return null;
  }
});

// Standard per-user paths (used to default the data folder to Documents/FocusPocus)
ipcMain.on('get-app-paths', (event) => {
  event.returnValue = {
    documents: app.getPath('documents'),
    userData: app.getPath('userData')
  };
});

// Native folder picker for choosing where Focus Pocus keeps its data
ipcMain.handle('choose-folder', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose where Focus Pocus keeps your data',
    defaultPath: defaultPath || undefined,
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  return result.filePaths[0];
});

// Handle window controls
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Restore and focus window (for alerts)
ipcMain.on('restore-and-focus-window', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setAlwaysOnTop(true, 'floating');
    // Flash the taskbar button too, so an alert is noticeable even with no sound
    mainWindow.flashFrame(true);
  }
});

ipcMain.on('stop-flash', () => {
  if (mainWindow) mainWindow.flashFrame(false);
});

// System speaker state: lets the renderer warn when alerts would be silent
ipcMain.handle('audio-get', () => getAudio());
ipcMain.handle('audio-set', (event, wanted) => setAudio(wanted));

// Handle stats window
ipcMain.on('show-stats-window', (event, statsData) => {
  if (statsWindow) {
    statsWindow.close();
  }

  statsWindow = new BrowserWindow({
    width: 480,
    height: 700,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    parent: mainWindow,
    modal: false,
    icon: path.join(__dirname, 'image', 'icon3.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      additionalArguments: [JSON.stringify(statsData)]
    }
  });

  statsWindow.loadFile('stats.html');
  statsWindow.setAlwaysOnTop(true, 'floating');

  statsWindow.on('closed', () => {
    statsWindow = null;
  });
});

ipcMain.on('close-stats-window', () => {
  if (statsWindow) {
    statsWindow.close();
  }
});
