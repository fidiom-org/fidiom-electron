import { ipcMain } from 'electron'
import { getSetting, setSetting } from './settings'

export const registerSettingsHandlers = (): void => {
  ipcMain.handle('settings:get', (_event, key: string) => getSetting(key))

  ipcMain.handle('settings:set', (_event, key: string, value: string) => setSetting(key, value))
}
