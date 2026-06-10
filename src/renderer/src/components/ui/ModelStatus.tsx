import { useEffect, useState } from 'react'
import { Button } from './Button'

type ModelState = 'checking' | 'ready' | 'missing' | 'downloading' | 'error'

export const ModelStatus = () => {
  const [state, setState] = useState<ModelState>('checking')
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    window.visionAPI
      .status()
      .then((s) => {
        if (active) setState(s.ready || s.loaded ? 'ready' : 'missing')
      })
      .catch(() => active && setState('missing'))

    const offProgress = window.visionAPI.onProgress((pct) => setProgress(pct))
    return () => {
      active = false
      offProgress()
    }
  }, [])

  const handleDownload = async (): Promise<void> => {
    setError('')
    setProgress(null)
    setState('downloading')
    try {
      await window.visionAPI.download()
      setState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
      setState('error')
    }
  }

  const dot = {
    checking: 'bg-zinc-500',
    ready: 'bg-emerald-400',
    missing: 'bg-amber-400',
    downloading: 'bg-amber-400 animate-pulse',
    error: 'bg-red-400'
  }[state]

  const label = {
    checking: 'Checking AI model…',
    ready: 'AI model ready',
    missing: 'AI model not downloaded',
    downloading: progress != null ? `Downloading… ${progress.toFixed(0)}%` : 'Downloading…',
    error: error || 'Download failed'
  }[state]

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <span className={state === 'error' ? 'text-red-400' : 'text-zinc-300'}>{label}</span>
      </div>

      {(state === 'missing' || state === 'error') && (
        <>
          <p className="mt-1 text-xs text-zinc-500">
            Needed to parse photos on-device. Downloads once, then works offline.
          </p>
          <Button variant="outline" className="mt-2 w-full" onClick={handleDownload}>
            {state === 'error' ? 'Retry download' : 'Download model'}
          </Button>
        </>
      )}

      {state === 'downloading' && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      )}
    </div>
  )
}
