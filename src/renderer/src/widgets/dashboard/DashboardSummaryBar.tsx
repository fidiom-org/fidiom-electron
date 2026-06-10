import type { DashboardSummary } from '@renderer/entities/dashboard/model/types'
import { formatCurrency } from '@renderer/shared/lib/format'

interface DashboardSummaryBarProps {
  summary: DashboardSummary
}

const items = [
  { key: 'operatingFunds' as const, label: 'Operating funds' },
  { key: 'investing' as const, label: 'Investing' },
  { key: 'debt' as const, label: 'Debt' },
  { key: 'netWorth' as const, label: 'Net worth' }
]

export const DashboardSummaryBar = ({ summary }: DashboardSummaryBarProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const value = summary[item.key]
        const isNegative = value < 0
        return (
          <div
            key={item.key}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
          >
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p
              className={`mt-1 text-base font-semibold sm:text-lg ${
                isNegative ? 'text-zinc-300' : 'text-zinc-100'
              }`}
            >
              {formatCurrency(value)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
