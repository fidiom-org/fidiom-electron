import type { RunwayInfo } from '@renderer/entities/dashboard/model/types'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { formatCurrency } from '@renderer/shared/lib/format'

interface RunwayCalculatorWidgetProps {
  runway: RunwayInfo
}

export const RunwayCalculatorWidget = ({ runway }: RunwayCalculatorWidgetProps) => {
  return (
    <ChartCard title="Runway calculator">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-zinc-500">Months remaining</p>
          <p className="mt-1 text-3xl font-semibold text-indigo-400">{runway.monthsRemaining}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500">Monthly burn</p>
            <p className="mt-1 font-medium">{formatCurrency(runway.monthlyBurn)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500">Cash on hand</p>
            <p className="mt-1 font-medium">{formatCurrency(runway.cashOnHand)}</p>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
