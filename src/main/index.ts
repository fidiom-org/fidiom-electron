import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as secureStore from './secure-store'
import { registerChatHandlers } from './chat-handlers'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  registerAuthHandlers()
  registerDbHandlers()
  registerChatHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Master-key auth IPC. The renderer drives the secure store's lifecycle through
// `window.authAPI` — the master key only ever lives in the main process.
function registerAuthHandlers(): void {
  ipcMain.handle('auth:status', () => secureStore.status())
  ipcMain.handle('auth:setup', (_event, masterKey: string) => secureStore.setup(masterKey))
  ipcMain.handle('auth:unlock', (_event, masterKey: string) => secureStore.unlock(masterKey))
  ipcMain.handle('auth:lock', () => secureStore.lock())
  ipcMain.handle('auth:reset', () => secureStore.reset())
}

// Database IPC. The renderer never touches the DB directly — it goes through
// `window.dbAPI` (preload) which invokes these channels in the main process.
// Every call hits the encrypted store, which throws while locked, so there is
// no data access without the master key.
function registerDbHandlers(): void {
  ipcMain.handle('db:status', () => secureStore.status())
  ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) =>
    secureStore.query(sql, params)
  )
  ipcMain.handle('db:exec', (_event, sql: string, params?: unknown[]) =>
    secureStore.exec(sql, params)
  )
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
