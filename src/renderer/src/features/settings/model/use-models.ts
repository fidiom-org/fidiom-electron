import { useEffect, useState } from 'react'

export type ModelEntry = Awaited<ReturnType<Window['modelsAPI']['list']>>[number]

interface UseModels {
  models: ModelEntry[]
  loading: boolean
  selectingId: string | null
  progress: number | null
  error: string
  select: (id: string) => Promise<void>
}

export const useModels = (): UseModels => {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    window.modelsAPI
      .list()
      .then((list) => {
        if (active) setModels(list)
      })
      .catch(() => active && setError('Could not load models'))
      .finally(() => {
        if (active) setLoading(false)
      })

    const offProgress = window.modelsAPI.onProgress((pct) => {
      if (active) setProgress(pct)
    })
    return () => {
      active = false
      offProgress()
    }
  }, [])

  const select = async (id: string): Promise<void> => {
    if (selectingId) return
    setError('')
    setProgress(null)
    setSelectingId(id)
    try {
      setModels(await window.modelsAPI.select(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch model')
    } finally {
      setSelectingId(null)
      setProgress(null)
    }
  }

  return { models, loading, selectingId, progress, error, select }
}
