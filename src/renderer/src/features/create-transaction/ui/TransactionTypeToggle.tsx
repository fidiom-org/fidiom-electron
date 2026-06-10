import type { TransactionType } from '@renderer/entities/transaction'
import { cn } from '@renderer/lib/cn'

interface TransactionTypeToggleProps {
  value: TransactionType
  onChange: (type: TransactionType) => void
}

const options: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' }
]

export const TransactionTypeToggle = ({ value, onChange }: TransactionTypeToggleProps) => {
  return (
    <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm transition-colors',
            value === option.value ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
