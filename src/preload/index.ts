import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)

    contextBridge.exposeInMainWorld('authAPI', {
      status: (): Promise<{ initialized: boolean; unlocked: boolean }> =>
        ipcRenderer.invoke('auth:status'),
      setup: (masterKey: string): Promise<void> => ipcRenderer.invoke('auth:setup', masterKey),
      unlock: (masterKey: string): Promise<boolean> => ipcRenderer.invoke('auth:unlock', masterKey),
      lock: (): Promise<void> => ipcRenderer.invoke('auth:lock'),
      reset: (): Promise<void> => ipcRenderer.invoke('auth:reset')
    })

    contextBridge.exposeInMainWorld('dbAPI', {
      status: (): Promise<{ initialized: boolean; unlocked: boolean }> =>
        ipcRenderer.invoke('db:status'),
      query: <T = unknown>(sql: string, params?: unknown[]): Promise<T[]> =>
        ipcRenderer.invoke('db:query', sql, params),
      exec: (sql: string, params?: unknown[]): Promise<void> =>
        ipcRenderer.invoke('db:exec', sql, params)
    })

    contextBridge.exposeInMainWorld('qvacAPI', {
      loadModel: (): Promise<string> => ipcRenderer.invoke('load-model'),
      infer: (history: { role: string; content: string }[]): Promise<void> =>
        ipcRenderer.invoke('infer', history),
      onCompletionStream: (cb: (token: string) => void): void => {
        ipcRenderer.on('completion-stream', (_event, token) => cb(token))
      },
      unloadModel: (): Promise<string> => ipcRenderer.invoke('unload-model')
    })

    contextBridge.exposeInMainWorld('chatAPI', {
      list: (projectId?: number) => ipcRenderer.invoke('chat:list', projectId),
      get: (chatId: number) => ipcRenderer.invoke('chat:get', chatId),
      create: (projectId?: number, title?: string | null) =>
        ipcRenderer.invoke('chat:create', projectId, title),
      appendMessage: (chatId: number, role: 'user' | 'assistant' | 'system', content: string) =>
        ipcRenderer.invoke('chat:appendMessage', chatId, role, content),
      delete: (chatId: number) => ipcRenderer.invoke('chat:delete', chatId),
      updateTitle: (
        chatId: number,
        title: string,
        titleStatus?: 'pending' | 'ready' | 'failed'
      ) => ipcRenderer.invoke('chat:updateTitle', chatId, title, titleStatus),
      generateTitle: (chatId: number) => ipcRenderer.invoke('chat:generateTitle', chatId)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
