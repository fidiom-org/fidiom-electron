import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as secureStore from './secure-store'
import { registerVisionHandlers } from './vision'
import { registerChatHandlers } from './chat-handlers'
import { registerLlmHandlers } from './llm'

function createWindow(): void {
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  registerAuthHandlers()
  registerDbHandlers()
  registerVisionHandlers()
  registerChatHandlers()
  registerLlmHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function registerAuthHandlers(): void {
  ipcMain.handle('auth:status', () => secureStore.status())
  ipcMain.handle('auth:setup', (_event, masterKey: string) => secureStore.setup(masterKey))
  ipcMain.handle('auth:unlock', (_event, masterKey: string) => secureStore.unlock(masterKey))
  ipcMain.handle('auth:lock', () => secureStore.lock())
  ipcMain.handle('auth:reset', () => secureStore.reset())
}

function registerDbHandlers(): void {
  ipcMain.handle('db:status', () => secureStore.status())
  ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) =>
    secureStore.query(sql, params)
  )
  ipcMain.handle('db:exec', (_event, sql: string, params?: unknown[]) =>
    secureStore.exec(sql, params)
  )
}
