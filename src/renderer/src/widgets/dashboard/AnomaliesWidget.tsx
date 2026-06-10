import type { SpendingAnomaly } from '@renderer/entities/dashboard/model/types'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { formatCurrency } from '@renderer/shared/lib/format'

interface AnomaliesWidgetProps {
  anomalies: SpendingAnomaly[]
}

const severityStyles: Record<SpendingAnomaly['severity'], string> = {
  low: 'bg-zinc-800 text-zinc-300',
  medium: 'bg-amber-500/15 text-amber-300',
  high: 'bg-rose-500/15 text-rose-300'
}

export const AnomaliesWidget = ({ anomalies }: AnomaliesWidgetProps): React.JSX.Element => {
  return (
    <ChartCard title="Spending anomalies">
      {anomalies.length === 0 ? (
        <p className="text-sm text-zinc-500">No anomalies detected this month.</p>
      ) : (
        <ul className="space-y-3">
          {anomalies.map((anomaly) => (
            <li
              key={anomaly.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-zinc-200">{anomaly.description}</p>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs capitalize ${severityStyles[anomaly.severity]}`}
                >
                  {anomaly.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{formatCurrency(anomaly.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
