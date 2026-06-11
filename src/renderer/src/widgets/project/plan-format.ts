import type { PlanMetric, ProjectCurrency } from '@renderer/entities/project'
import { formatCurrency } from '@renderer/shared/lib/format'

export const formatPlanMetricValue = (
  metric: PlanMetric,
  value: number | null,
  currency: ProjectCurrency
): string => {
  if (value === null) return '—'

  if (metric === 'runway') {
    return `${value} mo`
  }

  return formatCurrency(value, currency)
}
