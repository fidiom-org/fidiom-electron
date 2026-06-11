import { useRef, useState } from 'react'
import type { PaymentChangeRecord } from '@renderer/entities/project'
import { useClickOutside } from '@renderer/shared/lib/use-click-outside'

interface PaymentHistoryPopoverProps {
  history: PaymentChangeRecord[]
}

const formatTimestamp = (value: string): string => {
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const PaymentHistoryPopover = ({ history }: PaymentHistoryPopoverProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), open)

  if (history.length === 0) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg px-2 py-1 text-zinc-600"
        aria-label="No history"
      >
        🕐
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        aria-label="View change history"
      >
        🕐
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Change history
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-zinc-300">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-zinc-800/60 px-2.5 py-2">
                <p className="text-zinc-500">{formatTimestamp(entry.timestamp)}</p>
                <p className="mt-0.5">{entry.summary}</p>
                <p className="mt-1 text-zinc-400">Reason: {entry.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
