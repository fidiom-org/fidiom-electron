import type { ProjectKpi, ProjectCurrency } from '@renderer/entities/project'
import { formatCurrency } from '@renderer/shared/lib/format'

interface ProjectSummaryBarProps {
  kpi: ProjectKpi
  currency: ProjectCurrency
}

const items = [
  { key: 'burn' as const, label: 'Burn' },
  { key: 'cash' as const, label: 'Cash' },
  { key: 'runwayMonths' as const, label: 'Runway' },
  { key: 'revenue' as const, label: 'Revenue' }
]

export const ProjectSummaryBar = ({ kpi, currency }: ProjectSummaryBarProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        if (item.key === 'runwayMonths') {
          return (
            <div
              key={item.key}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              <p className="text-xs text-zinc-500">{item.label}</p>
              <p className="mt-1 text-base font-semibold text-zinc-100 sm:text-lg">
                {kpi.runwayMonths === null ? '—' : `${kpi.runwayMonths} mo`}
              </p>
            </div>
          )
        }

        if (item.key === 'revenue') {
          return (
            <div
              key={item.key}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              <p className="text-xs text-zinc-500">{item.label}</p>
              <p className="mt-1 text-base font-semibold text-zinc-100 sm:text-lg">
                {formatCurrency(kpi.revenue, currency)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                MRR {formatCurrency(kpi.mrr, currency)}
              </p>
            </div>
          )
        }

        const value = kpi[item.key]
        return (
          <div
            key={item.key}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
          >
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className="mt-1 text-base font-semibold text-zinc-100 sm:text-lg">
              {formatCurrency(value, currency)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
