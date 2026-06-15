import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import {
  getPairingInfo,
  getStatus,
  listConnections,
  p2pPing,
  p2pRequest,
  startP2P,
  stopP2P,
  type P2PEvent
} from './p2p'

function broadcast(event: P2PEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('p2p:event', event)
  }
}

export function registerP2PHandlers(): void {
  const storageDir = join(app.getPath('userData'), 'p2p')

  ipcMain.handle('p2p:start', () => startP2P({ storageDir, onEvent: broadcast }))
  ipcMain.handle('p2p:status', () => getStatus())
  ipcMain.handle('p2p:pairingInfo', () => getPairingInfo())
  ipcMain.handle('p2p:connections', () => listConnections())
  ipcMain.handle(
    'p2p:request',
    (_event, remoteKey: string, method: string, params: unknown, timeoutMs?: number) =>
      p2pRequest(remoteKey, method, params, timeoutMs)
  )
  ipcMain.handle('p2p:ping', (_event, remoteKey: string) => p2pPing(remoteKey))
  ipcMain.handle('p2p:stop', () => stopP2P())

  app.on('before-quit', () => {
    void stopP2P()
  })
}
