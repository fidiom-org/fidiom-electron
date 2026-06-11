import { ElectronAPI } from '@electron-toolkit/preload'

interface AuthStatus {
  initialized: boolean
  unlocked: boolean
}

interface AuthAPI {
  status: () => Promise<AuthStatus>
  setup: (masterKey: string) => Promise<void>
  unlock: (masterKey: string) => Promise<boolean>
  lock: () => Promise<void>
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

interface VisionParseResult {
  text: string
  stats?: unknown
}

interface VisionModelStatus {
  ready: boolean
  loaded: boolean
}

interface VisionAPI {
  status: () => Promise<VisionModelStatus>
  download: () => Promise<VisionModelStatus>
  parse: (bytes: Uint8Array, ext: string, prompt?: string) => Promise<VisionParseResult>
  onStream: (cb: (token: string) => void) => () => void
  onProgress: (cb: (percentage: number | null) => void) => () => void
  unload: () => Promise<void>
}

interface LlmModelStatus {
  ready: boolean
  loaded: boolean
}

interface LlmAPI {
  status: () => Promise<LlmModelStatus>
  download: () => Promise<LlmModelStatus>
  infer: (chatId: number) => Promise<string>
  onStream: (cb: (token: string) => void) => () => void
  onProgress: (cb: (percentage: number | null) => void) => () => void
  unload: () => Promise<void>
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

interface SettingsAPI {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
}

interface ModelStatusEntry {
  id: string
  label: string
  description: string
  sizeBytes: number
  cached: boolean
  active: boolean
  loaded: boolean
}

interface ModelsAPI {
  list: () => Promise<ModelStatusEntry[]>
  select: (id: string) => Promise<ModelStatusEntry[]>
  onProgress: (cb: (percentage: number | null) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    authAPI: AuthAPI
    dbAPI: DbAPI
    qvacAPI: QvacAPI
    visionAPI: VisionAPI
    llmAPI: LlmAPI
    chatAPI: ChatAPI
    settingsAPI: SettingsAPI
    modelsAPI: ModelsAPI
  }
}

export {}
