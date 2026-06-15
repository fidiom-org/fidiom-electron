import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@renderer/lib/cn'
import type { ExportFeedback } from '../model/use-export-transactions'

interface ExportToastProps {
  feedback: ExportFeedback | null
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 4000

export const ExportToast = ({ feedback, onDismiss }: ExportToastProps) => {
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [feedback, onDismiss])

  if (!feedback) return null

  const success = feedback.type === 'success'
  const Icon = success ? CheckCircle2 : AlertCircle

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl',
        success
          ? 'border-emerald-800 bg-emerald-950/90 text-emerald-200'
          : 'border-red-800 bg-red-950/90 text-red-200'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', success ? 'text-emerald-400' : 'text-red-400')} />
      <span className="text-sm">{feedback.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 rounded-md p-0.5 text-zinc-400 transition-colors hover:text-zinc-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
