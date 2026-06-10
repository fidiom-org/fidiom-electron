import { useEffect, useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/Button'

export interface ReceiptPrefill {
  amount?: string
  date?: string
  description?: string
}

type Status = 'idle' | 'busy' | 'error'

const ReceiptUpload = ({
  onContinue
}: {
  onContinue: (prefill: ReceiptPrefill | null) => void
}): React.JSX.Element => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => window.visionAPI.onProgress(setProgress), [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const selectFile = (next: File | null): void => {
    if (!next) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
    setError('')
    setStatus('idle')
  }

  const handleScan = async (): Promise<void> => {
    if (!file || status === 'busy') return
    setError('')
    setProgress(null)
    setStatus('busy')
    try {
      const buffer = await file.arrayBuffer()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const { text } = await window.visionAPI.parse(new Uint8Array(buffer), ext)
      onContinue(mapReceipt(text))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the photo')
      setStatus('error')
    }
  }

  const busy = status === 'busy'
  const busyLabel =
    progress != null ? `Downloading model… ${progress.toFixed(0)}%` : 'Reading photo…'

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 text-sm text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="receipt preview"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <span className="px-6 text-center">
            Click to upload a receipt photo
            <br />
            <span className="text-xs text-zinc-600">It’s read on-device, never uploaded</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
      />

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {busy && (
        <p className="flex items-center gap-2 text-sm text-amber-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          {busyLabel}
        </p>
      )}

      <Button className="w-full" onClick={handleScan} disabled={!file || busy}>
        {busy ? busyLabel : status === 'error' ? 'Try again' : 'Scan receipt'}
      </Button>

      <button
        type="button"
        onClick={() => onContinue(null)}
        disabled={busy}
        className="w-full text-center text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline disabled:opacity-40"
      >
        Enter manually
      </button>
    </div>
  )
}

const mapReceipt = (text: string): ReceiptPrefill => {
  const json = extractJson(text)
  if (!json) return {}

  const prefill: ReceiptPrefill = {}
  if (typeof json.total === 'number') prefill.amount = String(json.total)
  else if (typeof json.total === 'string' && json.total.trim()) prefill.amount = json.total.trim()

  const date = normalizeDate(json.date)
  if (date) prefill.date = date

  if (typeof json.merchant === 'string' && json.merchant.trim()) {
    prefill.description = json.merchant.trim()
  }
  return prefill
}

const extractJson = (text: string): Record<string, unknown> | null => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const value = JSON.parse(text.slice(start, end + 1))
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const normalizeDate = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : undefined
}

export default ReceiptUpload
