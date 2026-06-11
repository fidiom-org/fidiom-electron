import { CategoryPill, type TransactionListItem } from '@renderer/entities/transaction'
import { cn } from '@renderer/lib/cn'
import { formatCurrency, formatDate } from '@renderer/shared/lib/format'

interface TransactionRowProps {
  transaction: TransactionListItem
}

export const TransactionRow = ({ transaction }: TransactionRowProps) => {
  const { category, description, date, type, amount } = transaction

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
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
    </li>
  )
}
