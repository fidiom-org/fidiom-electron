import type { PlanMetricRow, ProjectCurrency, ProjectPlanData } from '@renderer/entities/project'
import { PlanMetricCard } from './PlanMetricCard'

interface PlanMetricsGridProps {
  plan: ProjectPlanData
  currency: ProjectCurrency
}

export const PlanMetricsGrid = ({ plan, currency }: PlanMetricsGridProps) => {
  const showActual = plan.isPast

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-4 py-3 text-sm text-zinc-400">
        {plan.isPast && 'Closed period — comparing actuals to targets.'}
        {plan.isCurrent && 'Current period — forecast reflects your current payment model.'}
        {!plan.isPast && !plan.isCurrent && 'Future period — forecast based on recurring payments.'}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plan.rows.map((row: PlanMetricRow) => (
          <PlanMetricCard key={row.metric} row={row} currency={currency} showActual={showActual} />
        ))}
      </div>
    </div>
  )
}
