import { ipcMain } from 'electron'
import {
  completion,
  getModelInfo,
  loadModel,
  QWEN3_1_7B_INST_Q4,
  unloadModel,
  type ModelProgressUpdate
} from '@qvac/sdk'
import * as chat from './chat'
import { buildFinancialContext, projectIdForChat } from './financial-context'

const MODEL = QWEN3_1_7B_INST_Q4
const CTX_SIZE = 4096

const SYSTEM_PROMPT = `You are Fidiom, an on-device AI CFO assistant.
Answer the user's questions about their personal or business finances using ONLY the
financial data provided below. Be concise and specific — cite real numbers from the
data when relevant. If the data does not contain the answer, say so plainly instead
of inventing figures. Amounts are in the project's base currency unless noted.`

let modelId: string | null = null
let loadingPromise: Promise<string> | null = null

function ensureModel(onProgress: (update: ModelProgressUpdate) => void): Promise<string> {
  if (modelId) return Promise.resolve(modelId)
  if (!loadingPromise) {
    loadingPromise = loadModel({
      modelSrc: MODEL,
      modelType: 'llm',
      modelConfig: { ctx_size: CTX_SIZE },
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
    const info = await getModelInfo({ name: MODEL.name })
    return { ready: info.isCached, loaded: false }
  } catch {
    return { ready: false, loaded: false }
  }
}

function buildHistory(chatId: number): { role: string; content: string }[] {
  const conversation = chat.getChat(chatId)
  if (!conversation) throw new Error(`Chat ${chatId} not found`)

  const projectId = projectIdForChat(chatId) ?? conversation.project_id
  const context = buildFinancialContext(projectId)

  const history: { role: string; content: string }[] = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n--- FINANCIAL DATA ---\n${context}`
    }
  ]

  for (const message of conversation.messages) {
    if (message.role === 'system') continue
    history.push({ role: message.role, content: message.content })
  }

  return history
}

export function registerLlmHandlers(): void {
  ipcMain.handle('llm:status', () => readStatus())

  ipcMain.handle('llm:download', async (event) => {
    await ensureModel((update) => event.sender.send('llm:progress', update.percentage ?? null))
    return readStatus()
  })

  ipcMain.handle('llm:infer', async (event, chatId: number) => {
    const id = await ensureModel((update) =>
      event.sender.send('llm:progress', update.percentage ?? null)
    )

    const run = completion({
      modelId: id,
      history: buildHistory(chatId),
      stream: true,
      captureThinking: true
    })

    for await (const ev of run.events) {
      if (ev.type === 'contentDelta') event.sender.send('llm:stream', ev.text)
    }
    event.sender.send('llm:stream', '')

    const final = await run.final
    const cleaned = final.contentText.trim().replace(/\<think\>[\s\S]*?\<\/think\>/g, '')
    return cleaned
  })

  ipcMain.handle('llm:unload', async () => {
    if (!modelId) return
    await unloadModel({ modelId, clearStorage: false })
    modelId = null
    loadingPromise = null
  })
}
