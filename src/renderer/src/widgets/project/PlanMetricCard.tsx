import type { PlanMetricRow, PlanMetricStatus, ProjectCurrency } from '@renderer/entities/project'
import { PLAN_OPERATOR_LABELS } from '@renderer/entities/project'
import { cn } from '@renderer/lib/cn'
import { formatPercent } from '@renderer/shared/lib/format'
import { formatPlanMetricValue } from './plan-format'

interface PlanMetricCardProps {
  row: PlanMetricRow
  currency: ProjectCurrency
  showActual: boolean
}

const statusLabels: Record<PlanMetricStatus, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  off_track: 'Off track',
  no_target: 'No target'
}

const statusStyles: Record<PlanMetricStatus, string> = {
  on_track: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  at_risk: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  off_track: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  no_target: 'border-zinc-700 bg-zinc-800/40 text-zinc-500'
}

export const PlanMetricCard = ({ row, currency, showActual }: PlanMetricCardProps) => {
  const targetLabel =
    row.target !== null && row.operator
      ? `${PLAN_OPERATOR_LABELS[row.operator]} ${formatPlanMetricValue(row.metric, row.target, currency)}`
      : null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">{row.label}</p>
          {targetLabel && <p className="mt-0.5 text-xs text-zinc-500">Target {targetLabel}</p>}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            statusStyles[row.status]
          )}
        >
          {statusLabels[row.status]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-zinc-500">Target</p>
          <p className="mt-1 text-sm font-semibold text-zinc-300">
            {formatPlanMetricValue(row.metric, row.target, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Forecast</p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">
            {formatPlanMetricValue(row.metric, row.forecast, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Actual</p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">
            {showActual
              ? formatPlanMetricValue(row.metric, row.actual, currency)
              : '—'}
          </p>
        </div>
      </div>

      {row.variancePct !== null && row.status !== 'no_target' && (
        <p className="mt-3 text-xs text-zinc-500">
          Variance {formatPercent(row.variancePct)} vs target
        </p>
      )}
    </div>
  )
}
