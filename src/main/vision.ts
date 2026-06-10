import { app, ipcMain } from 'electron'
import { unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  completion,
  getModelInfo,
  loadModel,
  MMPROJ_QWEN3VL_2B_MULTIMODAL_Q4_K,
  QWEN3VL_2B_MULTIMODAL_Q4_K,
  unloadModel,
  type ModelProgressUpdate
} from '@qvac/sdk'

const MODEL = QWEN3VL_2B_MULTIMODAL_Q4_K
const MMPROJ = MMPROJ_QWEN3VL_2B_MULTIMODAL_Q4_K
const CTX_SIZE = 2048

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

let modelId: string | null = null
let loadingPromise: Promise<string> | null = null

function ensureModel(onProgress: (update: ModelProgressUpdate) => void): Promise<string> {
  if (modelId) return Promise.resolve(modelId)
  if (!loadingPromise) {
    loadingPromise = loadModel({
      modelSrc: MODEL,
      modelType: 'llm',
      modelConfig: { ctx_size: CTX_SIZE, projectionModelSrc: MMPROJ },
      onProgress
    })
      .then((id) => {
        modelId = id
        return id
      })
      .catch((err) => {
        loadingPromise = null
        throw err
      })
  }
  return loadingPromise
}

async function readStatus(): Promise<{ ready: boolean; loaded: boolean }> {
  if (modelId) return { ready: true, loaded: true }
  try {
    const [main, proj] = await Promise.all([
      getModelInfo({ name: MODEL.name }),
      getModelInfo({ name: MMPROJ.name })
    ])
    return { ready: main.isCached && proj.isCached, loaded: false }
  } catch {
    return { ready: false, loaded: false }
  }
}

export function registerVisionHandlers(): void {
  ipcMain.handle('vision:status', () => readStatus())

  ipcMain.handle('vision:download', async (event) => {
    await ensureModel((update) => event.sender.send('vision:progress', update.percentage ?? null))
    return readStatus()
  })

  ipcMain.handle('vision:parse', async (event, bytes: Uint8Array, ext: string, prompt?: string) => {
    const id = await ensureModel((update) =>
      event.sender.send('vision:progress', update.percentage ?? null)
    )

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

  ipcMain.handle('vision:unload', async () => {
    if (!modelId) return
    await unloadModel({ modelId, clearStorage: false })
    modelId = null
    loadingPromise = null
  })
}
