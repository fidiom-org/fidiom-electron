import { embed, loadModel, unloadModel, EMBEDDINGGEMMA_300M_Q4_0 } from '@qvac/sdk'

let modelId: string | null = null
let loadingPromise: Promise<string> | null = null

const load = async (): Promise<string> => {
  try {
    console.log('[embeddings] loading EMBEDDINGGEMMA_300M_Q4_0 …')
    const id = await loadModel({
      modelSrc: EMBEDDINGGEMMA_300M_Q4_0,
      modelType: 'embeddings'
    })
    modelId = id
    console.log(`[embeddings] loaded (modelId=${id})`)
    return id
  } finally {
    loadingPromise = null
  }
}

export const ensureEmbeddingModel = (): Promise<string> => {
  if (modelId) return Promise.resolve(modelId)
  if (loadingPromise) return loadingPromise
  loadingPromise = load()
  return loadingPromise
}

export const embedText = async (text: string): Promise<number[]> => {
  const id = await ensureEmbeddingModel()
  const { embedding } = await embed({ modelId: id, text })
  return embedding
}

export const embedTexts = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) return []
  const id = await ensureEmbeddingModel()
  const { embedding } = await embed({ modelId: id, text: texts })
  return embedding
}

export const unloadEmbeddingModel = async (): Promise<void> => {
  if (!modelId) return
  await unloadModel({ modelId, clearStorage: false })
  modelId = null
  loadingPromise = null
}
