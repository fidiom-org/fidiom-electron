export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatTitleStatus = 'pending' | 'ready' | 'failed'

export interface Chat {
  id: number
  projectId: number
  title: string | null
  titleStatus: ChatTitleStatus
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: number
  chatId: number
  role: ChatRole
  content: string
  createdAt: string
}

export interface ChatWithMessages extends Chat {
  messages: ChatMessage[]
}

export const chatDisplayTitle = (chat: Pick<Chat, 'title' | 'titleStatus'>): string => {
  if (chat.title) return chat.title
  if (chat.titleStatus === 'pending') return 'New chat'
  return 'Untitled chat'
}

export const mapChatRow = (row: ChatRowDto): Chat => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  titleStatus: row.title_status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const mapMessageRow = (row: ChatMessageRowDto): ChatMessage => ({
  id: row.id,
  chatId: row.chat_id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at
})

interface ChatRowDto {
  id: number
  project_id: number
  title: string | null
  title_status: ChatTitleStatus
  created_at: string
  updated_at: string
}

interface ChatMessageRowDto {
  id: number
  chat_id: number
  role: ChatRole
  content: string
  created_at: string
}

export const mapChatWithMessages = (
  row: ChatRowDto & { messages: ChatMessageRowDto[] }
): ChatWithMessages => ({
  ...mapChatRow(row),
  messages: row.messages.map(mapMessageRow)
})
