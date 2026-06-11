import { app, ipcMain } from 'electron'
import { unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { completion } from '@qvac/sdk'
import { ensureModel, readStatus, unloadSharedModel } from './model'

const DEFAULT_PROMPT = `Extract the data from this receipt/invoice and return STRICTLY valid JSON
with no explanation and no markdown, matching this schema:
{
  "merchant": string | null,
  "date": string | null,        // ISO 8601 if recognizable
  "currency": string | null,
  "total": number | null,
  "items": [{ "name": string, "qty": number | null, "price": number | null }]
}
If a field is not recognizable, use null. Numbers must not include a currency symbol.`

export function registerVisionHandlers(): void {
  ipcMain.handle('vision:status', () => readStatus())

  ipcMain.handle('vision:download', async (event) => {
    await ensureModel((pct) => event.sender.send('vision:progress', pct))
    return readStatus()
  })

  ipcMain.handle('vision:parse', async (event, bytes: Uint8Array, ext: string, prompt?: string) => {
    const id = await ensureModel((pct) => event.sender.send('vision:progress', pct))

    const tmpPath = join(app.getPath('temp'), `qvac-vision-${Date.now()}.${ext || 'png'}`)
    await writeFile(tmpPath, Buffer.from(bytes))

    try {
      const run = completion({
        modelId: id,
        history: [
          {
            role: 'user',
            content: prompt?.trim() || DEFAULT_PROMPT,
            attachments: [{ path: tmpPath }]
          }
        ],
        stream: true
      })

      for await (const token of run.tokenStream) {
        event.sender.send('vision:stream', token)
      }
      event.sender.send('vision:stream', '')

      const text = await run.text
      const stats = await run.stats
      return { text, stats }
    } finally {
      await unlink(tmpPath).catch(() => {})
    }
  })

  ipcMain.handle('vision:unload', () => unloadSharedModel())
}
