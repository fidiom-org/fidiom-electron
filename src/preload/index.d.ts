import { ElectronAPI } from '@electron-toolkit/preload'

interface AuthStatus {
  /** Whether a master key has been configured (an encrypted db exists). */
  initialized: boolean
  /** Whether the db is currently unlocked in this session. */
  unlocked: boolean
}

interface AuthAPI {
  status: () => Promise<AuthStatus>
  /** First run: create the encrypted db from a new master key. */
  setup: (masterKey: string) => Promise<void>
  /** Returns false when the master key is wrong. */
  unlock: (masterKey: string) => Promise<boolean>
  lock: () => Promise<void>
  /** Wipe the encrypted db so a new master key can be set. */
  reset: () => Promise<void>
}

interface DbAPI {
  status: () => Promise<AuthStatus>
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>
  exec: (sql: string, params?: unknown[]) => Promise<void>
}

interface QvacAPI {
  loadModel: () => Promise<string>
  infer: (history: { role: string; content: string }[]) => Promise<void>
  onCompletionStream: (cb: (token: string) => void) => void
  unloadModel: () => Promise<string>
}

interface ChatRow {
  id: number
  project_id: number
  title: string | null
  title_status: 'pending' | 'ready' | 'failed'
  created_at: string
  updated_at: string
}

interface ChatMessageRow {
  id: number
  chat_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface ChatWithMessages extends ChatRow {
  messages: ChatMessageRow[]
}

interface ChatAPI {
  list: (projectId?: number) => Promise<ChatRow[]>
  get: (chatId: number) => Promise<ChatWithMessages | null>
  create: (projectId?: number, title?: string | null) => Promise<ChatRow>
  appendMessage: (
    chatId: number,
    role: ChatMessageRow['role'],
    content: string
  ) => Promise<ChatMessageRow>
  delete: (chatId: number) => Promise<void>
  updateTitle: (
    chatId: number,
    title: string,
    titleStatus?: ChatRow['title_status']
  ) => Promise<ChatRow>
  generateTitle: (chatId: number) => Promise<ChatRow>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    authAPI: AuthAPI
    dbAPI: DbAPI
    qvacAPI: QvacAPI
    chatAPI: ChatAPI
  }
}

export {}
