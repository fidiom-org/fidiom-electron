import { ipcMain } from 'electron'
import { completion } from '@qvac/sdk'
import * as chat from './chat'
import { buildFinancialContext, projectIdForChat } from './financial-context'
import { ensureModel, readStatus, unloadSharedModel } from './model'

const SYSTEM_PROMPT = `You are Fidiom, an on-device AI CFO assistant.
Answer the user's questions about their personal or business finances using ONLY the
financial data provided below. Be concise and specific — cite real numbers from the
data when relevant. If the data does not contain the answer, say so plainly instead
of inventing figures. Amounts are in the project's base currency unless noted.`

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
    await ensureModel((pct) => event.sender.send('llm:progress', pct))
    return readStatus()
  })

  ipcMain.handle('llm:infer', async (event, chatId: number) => {
    const id = await ensureModel((pct) => event.sender.send('llm:progress', pct))

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
    const cleaned = final.contentText.trim().replace(/<think>[\s\S]*?<\/think>/g, '')
    return cleaned
  })

  ipcMain.handle('llm:unload', () => unloadSharedModel())
}
