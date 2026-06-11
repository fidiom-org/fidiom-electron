import * as secureStore from './secure-store'

export interface ChatRow {
  id: number
  project_id: number
  title: string | null
  title_status: 'pending' | 'ready' | 'failed'
  created_at: string
  updated_at: string
}

export interface ChatMessageRow {
  id: number
  chat_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface ChatWithMessages extends ChatRow {
  messages: ChatMessageRow[]
}

const defaultProjectId = (): number => {
  const row = secureStore.query<{ id: number }>('SELECT id FROM projects ORDER BY id LIMIT 1')[0]
  if (!row) throw new Error('No project found — complete onboarding first')
  return row.id
}

const touchChat = (chatId: number): void => {
  secureStore.exec("UPDATE chats SET updated_at = datetime('now') WHERE id = ?", [chatId])
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'my',
  'me',
  'i',
  'we',
  'you',
  'your',
  'can',
  'could',
  'would',
  'should',
  'how',
  'what',
  'when',
  'where',
  'why',
  'is',
  'are',
  'do',
  'does',
  'did',
  'please',
  'help',
  'tell',
  'about',
  'for',
  'with',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on'
])

const capitalizeTitle = (text: string): string => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase())
}

const summarizeMock = (userText: string, assistantText: string): string => {
  const source = `${userText} ${assistantText}`.trim()
  if (!source) return 'New chat'

  const tokens = source
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))

  const unique = [...new Set(tokens)].slice(0, 4)
  if (unique.length === 0) {
    const fallback = userText.trim().split(/\s+/).slice(0, 5).join(' ')
    return capitalizeTitle(fallback || 'New chat')
  }

  return capitalizeTitle(unique.join(' '))
}

export const listChats = (projectId?: number): ChatRow[] => {
  const pid = projectId ?? defaultProjectId()
  return secureStore.query<ChatRow>(
    `SELECT id, project_id, title, title_status, created_at, updated_at
     FROM chats
     WHERE project_id = ?
     ORDER BY updated_at DESC, id DESC`,
    [pid]
  )
}

export const getChat = (chatId: number): ChatWithMessages | null => {
  const chat = secureStore.query<ChatRow>(
    `SELECT id, project_id, title, title_status, created_at, updated_at
     FROM chats WHERE id = ?`,
    [chatId]
  )[0]
  if (!chat) return null

  const messages = secureStore.query<ChatMessageRow>(
    `SELECT id, chat_id, role, content, created_at
     FROM chat_messages
     WHERE chat_id = ?
     ORDER BY created_at ASC, id ASC`,
    [chatId]
  )

  return { ...chat, messages }
}

export const createChat = (projectId?: number, title?: string | null): ChatRow => {
  const pid = projectId ?? defaultProjectId()
  secureStore.exec(
    `INSERT INTO chats (project_id, title, title_status)
     VALUES (?, ?, ?)`,
    [pid, title ?? null, title ? 'ready' : 'pending']
  )
  const chat = secureStore.query<ChatRow>(
    `SELECT id, project_id, title, title_status, created_at, updated_at
     FROM chats
     WHERE rowid = last_insert_rowid()`
  )[0]
  return chat
}

export const appendMessage = (
  chatId: number,
  role: ChatMessageRow['role'],
  content: string
): ChatMessageRow => {
  const chat = secureStore.query<{ id: number }>('SELECT id FROM chats WHERE id = ?', [chatId])[0]
  if (!chat) throw new Error(`Chat ${chatId} not found`)

  secureStore.exec('INSERT INTO chat_messages (chat_id, role, content) VALUES (?, ?, ?)', [
    chatId,
    role,
    content
  ])
  touchChat(chatId)

  return secureStore.query<ChatMessageRow>(
    `SELECT id, chat_id, role, content, created_at
     FROM chat_messages
     WHERE rowid = last_insert_rowid()`
  )[0]
}

export const deleteChat = (chatId: number): void => {
  secureStore.exec('DELETE FROM chats WHERE id = ?', [chatId])
}

export const updateChatTitle = (
  chatId: number,
  title: string,
  titleStatus: ChatRow['title_status'] = 'ready'
): ChatRow => {
  secureStore.exec(
    "UPDATE chats SET title = ?, title_status = ?, updated_at = datetime('now') WHERE id = ?",
    [title, titleStatus, chatId]
  )
  const chat = secureStore.query<ChatRow>(
    'SELECT id, project_id, title, title_status, created_at, updated_at FROM chats WHERE id = ?',
    [chatId]
  )[0]
  if (!chat) throw new Error(`Chat ${chatId} not found`)
  return chat
}

export const mockGenerateTitle = (chatId: number): ChatRow => {
  const firstUser = secureStore.query<{ content: string }>(
    `SELECT content FROM chat_messages
     WHERE chat_id = ? AND role = 'user'
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [chatId]
  )[0]

  const firstAssistant = secureStore.query<{ content: string }>(
    `SELECT content FROM chat_messages
     WHERE chat_id = ? AND role = 'assistant'
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [chatId]
  )[0]

  const title = summarizeMock(firstUser?.content ?? '', firstAssistant?.content ?? '')
  return updateChatTitle(chatId, title, 'ready')
}
