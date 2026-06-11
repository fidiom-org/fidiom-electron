import { ipcMain } from 'electron'
import { listModels, selectModel } from './model'

export const registerModelHandlers = (): void => {
  ipcMain.handle('models:list', () => listModels())

  ipcMain.handle('models:select', (event, id: string) =>
    selectModel(id, (pct) => event.sender.send('models:progress', pct))
  )
}
