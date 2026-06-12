import { getModelInfo, loadModel, unloadModel, type ModelProgressUpdate } from '@qvac/sdk'
import { getSetting, setSetting } from './settings'
import {
  DEFAULT_MODEL_ID,
  findModel,
  MODELS,
  modelDownloadSize,
  type ModelOption
} from './model-registry'

const CTX_SIZE = 4096
const ACTIVE_KEY = 'activeModelId'

let modelId: string | null = null
let loadedId: string | null = null
let loadingPromise: Promise<string> | null = null

const activeOption = (): ModelOption => {
  let id = DEFAULT_MODEL_ID
  try {
    id = getSetting(ACTIVE_KEY) ?? DEFAULT_MODEL_ID
  } catch {
    // store locked or not migrated yet — fall back to the default
  }
  return findModel(id) ?? findModel(DEFAULT_MODEL_ID)!
}

export const getActiveModelId = (): string => activeOption().id

export interface ModelStatusEntry {
  id: string
  label: string
  description: string
  sizeBytes: number
  cached: boolean
  active: boolean
  loaded: boolean
}

export interface LoadStatus {
  ready: boolean
  loaded: boolean
}

const overallPercentage = (update: ModelProgressUpdate): number | null =>
  update.fileSetInfo?.overallPercentage ??
  update.shardInfo?.overallPercentage ??
  update.percentage ??
  null

const isCached = async (option: ModelOption): Promise<boolean> => {
  try {
    const [main, proj] = await Promise.all([
      getModelInfo({ name: option.model.name }),
      getModelInfo({ name: option.mmproj.name })
    ])
    return main.isCached && proj.isCached
  } catch {
    return false
  }
}

const loadOption = async (
  option: ModelOption,
  onProgress: (pct: number | null) => void
): Promise<string> => {
  try {
    if (modelId) {
      await unloadModel({ modelId, clearStorage: false })
      modelId = null
      loadedId = null
    }
    const id = await loadModel({
      modelSrc: option.model,
      modelType: 'llm',
      modelConfig: { ctx_size: CTX_SIZE, projectionModelSrc: option.mmproj, tools: true },
      onProgress: (update) => onProgress(overallPercentage(update))
    })
    modelId = id
    loadedId = option.id
    return id
  } finally {
    loadingPromise = null
  }
}

export const ensureModel = (onProgress: (pct: number | null) => void): Promise<string> => {
  const option = activeOption()
  if (modelId && loadedId === option.id) return Promise.resolve(modelId)
  if (loadingPromise) return loadingPromise
  loadingPromise = loadOption(option, onProgress)
  return loadingPromise
}

export const readStatus = async (): Promise<LoadStatus> => {
  const option = activeOption()
  if (modelId && loadedId === option.id) return { ready: true, loaded: true }
  return { ready: await isCached(option), loaded: false }
}

export const listModels = async (): Promise<ModelStatusEntry[]> => {
  const active = getActiveModelId()
  return Promise.all(
    MODELS.map(async (option) => ({
      id: option.id,
      label: option.label,
      description: option.description,
      sizeBytes: modelDownloadSize(option),
      cached: await isCached(option),
      active: option.id === active,
      loaded: loadedId === option.id
    }))
  )
}

export const selectModel = async (
  id: string,
  onProgress: (pct: number | null) => void
): Promise<ModelStatusEntry[]> => {
  const option = findModel(id)
  if (!option) throw new Error(`Unknown model: ${id}`)
  setSetting(ACTIVE_KEY, id)
  await ensureModel(onProgress)
  return listModels()
}

export const unloadSharedModel = async (): Promise<void> => {
  if (!modelId) return
  await unloadModel({ modelId, clearStorage: false })
  modelId = null
  loadedId = null
  loadingPromise = null
}
