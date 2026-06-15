import { useMonthTransactions } from '@renderer/entities/transaction'
import type { TransactionSelection } from '@renderer/features/export-transactions'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { TransactionRow } from './TransactionRow'

interface TransactionListWidgetProps {
  month: number
  year: number
  selection?: TransactionSelection
}

export const TransactionListWidget = ({ month, year, selection }: TransactionListWidgetProps) => {
  const { transactions, loading } = useMonthTransactions(month, year)

  return (
    <ChartCard title="Transactions">
      {loading ? (
        <p className="text-sm text-zinc-500">Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-zinc-400">No transactions this month</p>
          <p className="mt-1 text-xs text-zinc-600">
            Use the Add transaction button to record one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/80">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} selection={selection} />
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
