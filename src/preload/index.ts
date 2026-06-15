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

    contextBridge.exposeInMainWorld('visionAPI', {
      status: (): Promise<{ ready: boolean; loaded: boolean }> =>
        ipcRenderer.invoke('vision:status'),
      download: (): Promise<{ ready: boolean; loaded: boolean }> =>
        ipcRenderer.invoke('vision:download'),
      parse: (
        bytes: Uint8Array,
        ext: string,
        prompt?: string
      ): Promise<{ text: string; stats?: unknown }> =>
        ipcRenderer.invoke('vision:parse', bytes, ext, prompt),
      onStream: (cb: (token: string) => void): (() => void) => {
        const listener = (_event: unknown, token: string): void => cb(token)
        ipcRenderer.on('vision:stream', listener)
        return () => ipcRenderer.removeListener('vision:stream', listener)
      },
      onProgress: (cb: (percentage: number | null) => void): (() => void) => {
        const listener = (_event: unknown, percentage: number | null): void => cb(percentage)
        ipcRenderer.on('vision:progress', listener)
        return () => ipcRenderer.removeListener('vision:progress', listener)
      },
      unload: (): Promise<void> => ipcRenderer.invoke('vision:unload')
    })

    contextBridge.exposeInMainWorld('llmAPI', {
      status: (): Promise<{ ready: boolean; loaded: boolean }> => ipcRenderer.invoke('llm:status'),
      download: (): Promise<{ ready: boolean; loaded: boolean }> =>
        ipcRenderer.invoke('llm:download'),
      infer: (chatId: number): Promise<string> => ipcRenderer.invoke('llm:infer', chatId),
      onStream: (cb: (token: string) => void): (() => void) => {
        const listener = (_event: unknown, token: string): void => cb(token)
        ipcRenderer.on('llm:stream', listener)
        return () => ipcRenderer.removeListener('llm:stream', listener)
      },
      onProgress: (cb: (percentage: number | null) => void): (() => void) => {
        const listener = (_event: unknown, percentage: number | null): void => cb(percentage)
        ipcRenderer.on('llm:progress', listener)
        return () => ipcRenderer.removeListener('llm:progress', listener)
      },
      onTool: (cb: (tool: { name: string; arguments: unknown }) => void): (() => void) => {
        const listener = (_event: unknown, tool: { name: string; arguments: unknown }): void =>
          cb(tool)
        ipcRenderer.on('llm:tool', listener)
        return () => ipcRenderer.removeListener('llm:tool', listener)
      },
      unload: (): Promise<void> => ipcRenderer.invoke('llm:unload')
    })

    contextBridge.exposeInMainWorld('speechAPI', {
      transcribe: (pcm: Uint8Array): Promise<string> =>
        ipcRenderer.invoke('speech:transcribe', pcm),
      speak: (text: string): Promise<Uint8Array> => ipcRenderer.invoke('speech:speak', text),
      onProgress: (cb: (percentage: number | null) => void): (() => void) => {
        const listener = (_event: unknown, percentage: number | null): void => cb(percentage)
        ipcRenderer.on('speech:progress', listener)
        return () => ipcRenderer.removeListener('speech:progress', listener)
      },
      unload: (): Promise<void> => ipcRenderer.invoke('speech:unload')
    })

    contextBridge.exposeInMainWorld('chatAPI', {
      list: (projectId?: number) => ipcRenderer.invoke('chat:list', projectId),
      get: (chatId: number) => ipcRenderer.invoke('chat:get', chatId),
      create: (projectId?: number, title?: string | null) =>
        ipcRenderer.invoke('chat:create', projectId, title),
      appendMessage: (chatId: number, role: 'user' | 'assistant' | 'system', content: string) =>
        ipcRenderer.invoke('chat:appendMessage', chatId, role, content),
      delete: (chatId: number) => ipcRenderer.invoke('chat:delete', chatId),
      updateTitle: (chatId: number, title: string, titleStatus?: 'pending' | 'ready' | 'failed') =>
        ipcRenderer.invoke('chat:updateTitle', chatId, title, titleStatus),
      generateTitle: (chatId: number) => ipcRenderer.invoke('chat:generateTitle', chatId)
    })

    contextBridge.exposeInMainWorld('settingsAPI', {
      get: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
      set: (key: string, value: string): Promise<void> =>
        ipcRenderer.invoke('settings:set', key, value)
    })

    contextBridge.exposeInMainWorld('exportAPI', {
      saveCsv: (
        defaultName: string,
        contents: string
      ): Promise<{ saved: boolean; filePath?: string }> =>
        ipcRenderer.invoke('export:saveCsv', defaultName, contents)
    })

    contextBridge.exposeInMainWorld('documentsAPI', {
      list: (projectId?: number) => ipcRenderer.invoke('documents:list', projectId),
      add: (filename: string, text: string, projectId?: number) =>
        ipcRenderer.invoke('documents:add', filename, text, projectId),
      delete: (documentId: number, projectId?: number) =>
        ipcRenderer.invoke('documents:delete', documentId, projectId)
    })

    contextBridge.exposeInMainWorld('projectsAPI', {
      hydrate: () => ipcRenderer.invoke('projects:hydrate'),
      create: (input: unknown) => ipcRenderer.invoke('projects:create', input),
      addPayment: (projectId: string, input: unknown) =>
        ipcRenderer.invoke('projects:addPayment', projectId, input),
      updatePayment: (paymentId: string, input: unknown) =>
        ipcRenderer.invoke('projects:updatePayment', paymentId, input),
      deletePayment: (paymentId: string, input: unknown) =>
        ipcRenderer.invoke('projects:deletePayment', paymentId, input),
      addEmployee: (projectId: string, input: unknown) =>
        ipcRenderer.invoke('projects:addEmployee', projectId, input),
      updateEmployee: (employeeId: string, input: unknown) =>
        ipcRenderer.invoke('projects:updateEmployee', employeeId, input),
      deleteEmployee: (employeeId: string, input: unknown) =>
        ipcRenderer.invoke('projects:deleteEmployee', employeeId, input),
      savePlanTargets: (projectId: string, period: unknown, inputs: unknown[]) =>
        ipcRenderer.invoke('projects:savePlanTargets', projectId, period, inputs)
    })

    contextBridge.exposeInMainWorld('modelsAPI', {
      list: () => ipcRenderer.invoke('models:list'),
      select: (id: string) => ipcRenderer.invoke('models:select', id),
      onProgress: (cb: (percentage: number | null) => void): (() => void) => {
        const listener = (_event: unknown, percentage: number | null): void => cb(percentage)
        ipcRenderer.on('models:progress', listener)
        return () => ipcRenderer.removeListener('models:progress', listener)
      }
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
