import { computeKpi } from './compute'
import {
  expandPlanPeriodToMonths,
  isPlanPeriodCurrent,
  isPlanPeriodPast
} from './plan-period'
import type { PlanPeriod } from './plan-period'
import {
  PLAN_METRIC_LABELS,
  PLAN_METRICS,
  type PlanMetric,
  type PlanMetricRow,
  type PlanMetricStatus,
  type PlanTarget,
  type PlanTargetOperator,
  type ProjectPlanData
} from './plan-types'
import type { Payment, Project, ProjectKpi } from './types'

const kpiValue = (kpi: ProjectKpi, metric: PlanMetric): number => {
  if (metric === 'runway') return kpi.runwayMonths ?? 0
  return kpi[metric]
}

export const aggregateMetricValue = (
  metric: PlanMetric,
  project: Project,
  payments: Payment[],
  period: PlanPeriod
): number => {
  const months = expandPlanPeriodToMonths(period)

  if (months.length === 1) {
    return kpiValue(computeKpi(project, payments, months[0]), metric)
  }

  const kpis = months.map((month) => computeKpi(project, payments, month))

  switch (metric) {
    case 'revenue':
      return kpis.reduce((total, kpi) => total + kpi.revenue, 0)
    case 'burn':
      return kpis.reduce((total, kpi) => total + kpi.burn, 0) / kpis.length
    case 'cash':
    case 'mrr':
      return kpiValue(kpis[kpis.length - 1], metric)
    case 'runway':
      return kpis[kpis.length - 1].runwayMonths ?? 0
  }
}

const meetsTarget = (
  value: number,
  target: number,
  operator: PlanTargetOperator
): boolean => {
  if (operator === 'gte') return value >= target
  if (operator === 'lte') return value <= target
  return value === target
}

const variancePct = (
  value: number,
  target: number,
  operator: PlanTargetOperator
): number => {
  if (target === 0) return 0

  if (operator === 'lte') {
    return Math.round(((value - target) / target) * 100)
  }

  return Math.round(((value - target) / target) * 100)
}

const evaluateStatus = (
  value: number,
  target: number,
  operator: PlanTargetOperator
): PlanMetricStatus => {
  if (meetsTarget(value, target, operator)) return 'on_track'

  const delta = Math.abs(variancePct(value, target, operator))
  if (delta <= 10) return 'at_risk'

  return 'off_track'
}

const buildMetricRow = (
  metric: PlanMetric,
  targets: PlanTarget[],
  forecast: number,
  actual: number | null,
  isPast: boolean
): PlanMetricRow => {
  const target = targets.find((item) => item.metric === metric) ?? null
  const comparisonValue = isPast ? actual : forecast

  if (!target) {
    return {
      metric,
      label: PLAN_METRIC_LABELS[metric],
      operator: null,
      target: null,
      forecast,
      actual: isPast ? actual : null,
      status: 'no_target',
      variancePct: null
    }
  }

  return {
    metric,
    label: PLAN_METRIC_LABELS[metric],
    operator: target.operator,
    target: target.targetValue,
    forecast,
    actual: isPast ? actual : null,
    status: evaluateStatus(comparisonValue ?? 0, target.targetValue, target.operator),
    variancePct:
      comparisonValue === null
        ? null
        : variancePct(comparisonValue, target.targetValue, target.operator)
  }
}

export const computeProjectPlan = (
  project: Project,
  payments: Payment[],
  period: PlanPeriod,
  targets: PlanTarget[]
): ProjectPlanData => {
  const isPast = isPlanPeriodPast(period)
  const isCurrent = isPlanPeriodCurrent(period)

  const rows = PLAN_METRICS.map((metric) => {
    const forecastValue = aggregateMetricValue(metric, project, payments, period)
    const actualValue = isPast ? forecastValue : null

    return buildMetricRow(metric, targets, forecastValue, actualValue, isPast)
  })

  return { period, rows, isPast, isCurrent }
}
