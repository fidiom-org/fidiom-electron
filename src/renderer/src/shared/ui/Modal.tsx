import { useEffect, type ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export const Modal = ({ open, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
