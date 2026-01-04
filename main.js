const { app, BrowserWindow, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const activeWin = require('active-win');

let mainWindow;
let statsWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 450,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

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

// Handle stats window
ipcMain.on('show-stats-window', (event, statsData) => {
  if (statsWindow) {
    statsWindow.close();
  }

  statsWindow = new BrowserWindow({
    width: 480,
    height: 620,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    parent: mainWindow,
    modal: false,
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
