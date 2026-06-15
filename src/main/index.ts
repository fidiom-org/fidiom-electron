import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import * as secureStore from './secure-store'
import { registerVisionHandlers } from './vision'
import { registerSpeechHandlers } from './speech'
import { registerChatHandlers } from './chat-handlers'
import { registerLlmHandlers } from './llm'
import { registerModelHandlers } from './model-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerExportHandlers } from './export-handlers'
import { registerDocumentHandlers } from './document-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerP2PHandlers } from './p2p-handlers'

// resources/ ships via packagerConfig.extraResource (packaged) and sits at the
// app root in dev. macOS ignores the BrowserWindow icon (uses the bundle icon).
const iconPath = app.isPackaged
  ? join(process.resourcesPath, 'resources', 'icon.png')
  : join(app.getAppPath(), 'resources', 'icon.png')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 720,
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media')
  })

  registerAuthHandlers()
  registerDbHandlers()
  registerVisionHandlers()
  registerSpeechHandlers()
  registerChatHandlers()
  registerLlmHandlers()
  registerModelHandlers()
  registerSettingsHandlers()
  registerExportHandlers()
  registerDocumentHandlers()
  registerProjectHandlers()
  registerP2PHandlers()

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
