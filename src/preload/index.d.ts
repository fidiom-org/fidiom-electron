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
  onTool: (cb: (tool: { name: string; arguments: unknown }) => void) => () => void
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

interface ExportAPI {
  saveCsv: (defaultName: string, contents: string) => Promise<{ saved: boolean; filePath?: string }>
}

interface SpeechAPI {
  transcribe: (pcm: Uint8Array) => Promise<string>
  speak: (text: string) => Promise<Uint8Array>
  onProgress: (cb: (percentage: number | null) => void) => () => void
  unload: () => Promise<void>
}

interface DocumentRow {
  id: number
  project_id: number
  filename: string
  char_count: number
  chunk_count: number
  created_at: string
}

interface DocumentsAPI {
  list: (projectId?: number) => Promise<DocumentRow[]>
  add: (filename: string, text: string, projectId?: number) => Promise<DocumentRow>
  delete: (documentId: number, projectId?: number) => Promise<void>
}

interface ProjectEntity {
  id: string
  name: string
  type: 'personal' | 'business'
  currency: 'USD' | 'EUR' | 'GBP'
  initialCash: number
  description: string | null
  createdAt: string
}

interface ChangeRecord {
  id: string
  timestamp: string
  summary: string
  reason: string
}

interface PaymentEntity {
  id: string
  projectId: string
  direction: 'expense' | 'income'
  vendor: string
  amount: number
  type: 'recurring' | 'one-time'
  category: string
  date: string | null
  billingDay: number | null
  note: string | null
  deletedAt: string | null
  history: ChangeRecord[]
  createdAt: string
}

interface EmployeeEntity {
  id: string
  projectId: string
  name: string
  salary: number
  deletedAt: string | null
  history: ChangeRecord[]
  createdAt: string
}

interface PlanPeriodEntity {
  granularity: 'month' | 'quarter'
  month: number
  year: number
}

interface PlanTargetEntity {
  id: string
  projectId: string
  metric: 'revenue' | 'burn' | 'cash' | 'mrr' | 'runway'
  targetValue: number
  operator: 'gte' | 'lte' | 'eq'
  period: PlanPeriodEntity
  createdAt: string
  updatedAt: string
}

interface ProjectsHydrateResult {
  projects: ProjectEntity[]
  payments: PaymentEntity[]
  employees: EmployeeEntity[]
  planTargets: PlanTargetEntity[]
}

interface ProjectsAPI {
  hydrate: () => Promise<ProjectsHydrateResult>
  create: (input: {
    name: string
    currency: 'USD' | 'EUR' | 'GBP'
    initialCash?: number
    description?: string
    type?: 'personal' | 'business'
  }) => Promise<ProjectEntity>
  addPayment: (
    projectId: string,
    input: {
      direction: 'expense' | 'income'
      vendor: string
      amount: number
      type: 'recurring' | 'one-time'
      category: string
      date: string | null
      billingDay: number | null
      note: string | null
    }
  ) => Promise<PaymentEntity>
  updatePayment: (
    paymentId: string,
    input: {
      direction: 'expense' | 'income'
      vendor: string
      amount: number
      type: 'recurring' | 'one-time'
      category: string
      date: string | null
      billingDay: number | null
      note: string | null
      reason: string
    }
  ) => Promise<PaymentEntity | null>
  deletePayment: (paymentId: string, input: { reason: string }) => Promise<PaymentEntity | null>
  addEmployee: (
    projectId: string,
    input: { name: string; salary: number }
  ) => Promise<EmployeeEntity>
  updateEmployee: (
    employeeId: string,
    input: { name: string; salary: number; reason: string }
  ) => Promise<EmployeeEntity | null>
  deleteEmployee: (employeeId: string, input: { reason: string }) => Promise<EmployeeEntity | null>
  savePlanTargets: (
    projectId: string,
    period: PlanPeriodEntity,
    inputs: Array<{
      metric: PlanTargetEntity['metric']
      targetValue: number
      operator: PlanTargetEntity['operator']
    }>
  ) => Promise<PlanTargetEntity[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    authAPI: AuthAPI
    dbAPI: DbAPI
    visionAPI: VisionAPI
    speechAPI: SpeechAPI
    llmAPI: LlmAPI
    chatAPI: ChatAPI
    settingsAPI: SettingsAPI
    modelsAPI: ModelsAPI
    exportAPI: ExportAPI
    documentsAPI: DocumentsAPI
    projectsAPI: ProjectsAPI
  }
}

export {}
