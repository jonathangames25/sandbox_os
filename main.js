const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('path');

// NOTE: The "GPU state invalid" console error is a harmless Chromium warning.
// Do NOT disable hardware acceleration — it breaks the video capture pipeline on Windows.

// Fix video capture on systems without a dedicated GPU
app.commandLine.appendSwitch('disable-features', 'VideoCaptureUseGpuMemoryBuffer,MediaFoundationVideoCapture');
app.commandLine.appendSwitch('enable-features', 'RunVideoCaptureServiceInBrowserProcess');



function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  win.loadFile('index.html');
  
  // Handle permission requests for microphone automatically
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'audioCapture', 'videoCapture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      return callback(true);
    }
    callback(false);
  });


  // Optional: open dev tools for easier debugging
  // win.webContents.openDevTools();
}

ipcMain.handle('select-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
