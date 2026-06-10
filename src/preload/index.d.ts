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
  /** Weights + vision projector are present in the local cache (no download needed). */
  ready: boolean
  /** Model is resident in memory this session. */
  loaded: boolean
}

interface VisionAPI {
  /** Check whether the model is downloaded/loaded. */
  status: () => Promise<VisionModelStatus>
  /** Download (and load) the model; emits progress over `onProgress`. */
  download: () => Promise<VisionModelStatus>
  parse: (bytes: Uint8Array, ext: string, prompt?: string) => Promise<VisionParseResult>
  onStream: (cb: (token: string) => void) => () => void
  onProgress: (cb: (percentage: number | null) => void) => () => void
  unload: () => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    authAPI: AuthAPI
    dbAPI: DbAPI
    qvacAPI: QvacAPI
    visionAPI: VisionAPI
  }
}

export {}
