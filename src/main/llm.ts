import { ipcMain } from 'electron'
import { completion, type Tool } from '@qvac/sdk'
import * as chat from './chat'
import { buildFinancialContext, projectIdForChat } from './financial-context'
import { buildRagContext } from './rag'
import { createFinancialTools } from './financial-tools'
import { unloadEmbeddingModel } from './embeddings'
import { ensureModel, readStatus, unloadSharedModel } from './model'

const SYSTEM_PROMPT = `You are Fibiom, an on-device AI CFO assistant.
Answer the user's questions about their personal or business finances.
A snapshot of the financial data is provided below for grounding. When a question
needs an exact figure, a specific transaction, or a semantic lookup, CALL THE TOOLS
instead of guessing — they query the live data. Be concise and specific, cite real
numbers, and if the data does not contain the answer, say so plainly instead of
inventing figures. Amounts are in the project's base currency unless noted.`

const MAX_STEPS = 5

interface Msg {
  role: string
  content: string
}

async function buildHistory(chatId: number): Promise<{ history: Msg[]; projectId: number }> {
  const conversation = chat.getChat(chatId)
  if (!conversation) throw new Error(`Chat ${chatId} not found`)

  const projectId = projectIdForChat(chatId) ?? conversation.project_id
  const context = buildFinancialContext(projectId)

  const lastUser = [...conversation.messages].reverse().find((m) => m.role === 'user')
  const ragContext = lastUser ? await buildRagContext(projectId, lastUser.content) : ''

  const sections = [SYSTEM_PROMPT, `--- FINANCIAL DATA ---\n${context}`]
  if (ragContext) sections.push(`--- RELEVANT RECORDS ---\n${ragContext}`)

  const history: Msg[] = [{ role: 'system', content: sections.join('\n\n') }]
  for (const message of conversation.messages) {
    if (message.role === 'system') continue
    history.push({ role: message.role, content: message.content })
  }

  return { history, projectId }
}

const cleanText = (text: string): string =>
  text
    .trim()
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()

export function registerLlmHandlers(): void {
  ipcMain.handle('llm:status', () => readStatus())

  ipcMain.handle('llm:download', async (event) => {
    await ensureModel((pct) => event.sender.send('llm:progress', pct))
    return readStatus()
  })

  ipcMain.handle('llm:infer', async (event, chatId: number) => {
    const id = await ensureModel((pct) => event.sender.send('llm:progress', pct))

    const { history, projectId } = await buildHistory(chatId)
    const { tools, run: runTool } = createFinancialTools(projectId)
    const toolList: Tool[] = tools

    let answer = ''
    for (let step = 0; step < MAX_STEPS; step++) {
      const run = completion({
        modelId: id,
        history,
        tools: toolList,
        stream: true,
        captureThinking: true
      })

      for await (const ev of run.events) {
        if (ev.type === 'contentDelta') event.sender.send('llm:stream', ev.text)
      }

      const final = await run.final
      const text = final.contentText ?? ''

      if (final.toolCalls.length === 0) {
        if (final.stopReason === 'length') {
          console.warn('[llm] response truncated (stopReason: length)')
        }
        answer = cleanText(text)
        break
      }

      history.push({ role: 'assistant', content: text })
      for (const call of final.toolCalls) {
        const result = await runTool(call)
        console.log(
          `[llm] tool#${step} ${call.name}(${JSON.stringify(call.arguments)}) → ${result.length} chars`
        )
        event.sender.send('llm:tool', {
          name: call.name,
          arguments: call.arguments
        })
        history.push({ role: 'tool', content: `${call.name} → ${result}` })
      }

      if (step === MAX_STEPS - 1) answer = cleanText(text)
    }

    event.sender.send('llm:stream', '')
    return answer
  })

  ipcMain.handle('llm:unload', async () => {
    await Promise.all([unloadSharedModel(), unloadEmbeddingModel()])
  })
}
