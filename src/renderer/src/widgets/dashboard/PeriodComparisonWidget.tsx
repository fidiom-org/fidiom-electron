import type { PeriodComparison } from '@renderer/entities/dashboard/model/types'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { formatCurrency, formatPercent } from '@renderer/shared/lib/format'

interface PeriodComparisonWidgetProps {
  comparison: PeriodComparison
}

export const PeriodComparisonWidget = ({ comparison }: PeriodComparisonWidgetProps) => {
  const isIncrease = comparison.changePercent > 0

  return (
    <ChartCard title="Period comparison">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500">{comparison.currentLabel}</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(comparison.currentTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">{comparison.previousLabel}</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(comparison.previousTotal)}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
        <p className="text-xs text-zinc-500">Change vs previous month</p>
        <p
          className={`mt-1 text-xl font-semibold ${
            isIncrease ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {formatPercent(comparison.changePercent)}
        </p>
      </div>
    </ChartCard>
  )
}
