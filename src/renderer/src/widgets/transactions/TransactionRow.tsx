import { CategoryPill, type TransactionListItem } from '@renderer/entities/transaction'
import { useCreateTransactionModal } from '@renderer/features/create-transaction'
import type { TransactionSelection } from '@renderer/features/export-transactions'
import { cn } from '@renderer/lib/cn'
import { formatCurrency, formatDate } from '@renderer/shared/lib/format'

interface TransactionRowProps {
  transaction: TransactionListItem
  selection?: TransactionSelection
}

export const TransactionRow = ({ transaction, selection }: TransactionRowProps) => {
  const { openEdit } = useCreateTransactionModal()
  const { category, description, date, type, amount } = transaction

  const selectionMode = selection?.selectionMode ?? false
  const selected = selection?.isSelected(transaction.id) ?? false

  const handleClick = (): void => {
    if (selectionMode && selection) selection.toggle(transaction)
    else openEdit(transaction)
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className="-mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-zinc-800/40"
      >
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected}
            readOnly
            tabIndex={-1}
            className="h-4 w-4 shrink-0 accent-indigo-600"
          />
        )}
        <CategoryPill category={category} size="sm" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-zinc-300">
            {description || category?.label || 'Transaction'}
          </p>
          <p className="text-xs text-zinc-500">{formatDate(date)}</p>
        </div>
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            type === 'income' ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {type === 'income' ? '+' : '−'}
          {formatCurrency(amount)}
        </span>
      </button>
    </li>
  )
}
