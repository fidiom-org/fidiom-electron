import type { FinanceMode } from '@renderer/entities/dashboard/model/types'
import { cn } from '@renderer/lib/cn'

interface FinanceModeToggleProps {
  mode: FinanceMode
  onChange: (mode: FinanceMode) => void
}

const options: { value: FinanceMode; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' }
]

export const FinanceModeToggle = ({ mode, onChange }: FinanceModeToggleProps) => {
  return (
    <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm transition-colors',
            mode === option.value ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
