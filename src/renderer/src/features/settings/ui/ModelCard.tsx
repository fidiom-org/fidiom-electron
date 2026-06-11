import { Button } from '@renderer/components/ui/Button'
import { cn } from '@renderer/lib/cn'
import { formatBytes } from '@renderer/shared/lib/format'
import type { ModelEntry } from '../model/use-models'

interface ModelCardProps {
  model: ModelEntry
  selecting: boolean
  busy: boolean
  progress: number | null
  onSelect: () => void
}

const Badge = ({ children, tone }: { children: string; tone: 'active' | 'cached' }) => (
  <span
    className={cn(
      'rounded-full px-2 py-0.5 text-xs font-medium',
      tone === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-700/50 text-zinc-300'
    )}
  >
    {children}
  </span>
)

export const ModelCard = ({ model, selecting, busy, progress, onSelect }: ModelCardProps) => {
  const buttonLabel = selecting
    ? progress != null
      ? `Downloading… ${progress.toFixed(0)}%`
      : 'Loading…'
    : model.cached
      ? 'Use this model'
      : 'Download & use'

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        model.active ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/40'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-zinc-100">{model.label}</p>
            {model.active && <Badge tone="active">Active</Badge>}
            {!model.active && model.cached && <Badge tone="cached">Downloaded</Badge>}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{model.description}</p>
          <p className="mt-1 text-xs text-zinc-600">Download size {formatBytes(model.sizeBytes)}</p>
        </div>

        {model.active ? (
          <span className="shrink-0 text-sm text-emerald-400">In use</span>
        ) : (
          <Button variant="outline" className="shrink-0" disabled={busy} onClick={onSelect}>
            {buttonLabel}
          </Button>
        )}
      </div>

      {selecting && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      )}
    </div>
  )
}
