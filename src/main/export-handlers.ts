import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'

export const registerExportHandlers = (): void => {
  ipcMain.handle('export:saveCsv', async (event, defaultName: string, contents: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const options = {
      defaultPath: defaultName,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    }
    const { canceled, filePath } = win
      ? await dialog.showSaveDialog(win, options)
      : await dialog.showSaveDialog(options)
    if (canceled || !filePath) return { saved: false }
    await writeFile(filePath, contents, 'utf8')
    return { saved: true, filePath }
  })
}
