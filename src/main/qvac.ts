import { BrowserWindow, ipcMain } from 'electron'

let modelId: string | null = null

export function registerQvacHandlers(win: BrowserWindow): void {
  ipcMain.handle('load-model', async () => {
    // modelId = await loadModel({
    //   modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    //   modelType: 'llm',
    //   onProgress: (progress) => console.log(progress)
    // })
    // return 'model loaded'
    void modelId
    throw new Error('QVAC SDK not installed — see src/main/qvac.ts')
  })

  ipcMain.handle('infer', async (_event, _history) => {
    if (!modelId) throw new Error('Model not loaded.')
    // const result = completion({ modelId, history: _history, stream: true })
    // for await (const token of result.tokenStream) {
    //   win.webContents.send('completion-stream', token)
    // }
    // win.webContents.send('completion-stream', '')
    void win
  })

  ipcMain.handle('unload-model', async () => {
    if (!modelId) throw new Error('Model not loaded.')
    // await unloadModel({ modelId })
    modelId = null
    return 'model unloaded'
  })
}
