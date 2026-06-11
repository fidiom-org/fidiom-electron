import type { PlanPeriod } from './plan-period'

export type PlanMetric = 'revenue' | 'burn' | 'cash' | 'mrr' | 'runway'
export type PlanTargetOperator = 'gte' | 'lte' | 'eq'
export type PlanMetricStatus = 'on_track' | 'at_risk' | 'off_track' | 'no_target'

export interface PlanTarget {
  id: string
  projectId: string
  metric: PlanMetric
  targetValue: number
  operator: PlanTargetOperator
  period: PlanPeriod
  createdAt: string
  updatedAt: string
}

export interface PlanTargetInput {
  metric: PlanMetric
  targetValue: number
  operator: PlanTargetOperator
}

export interface PlanMetricRow {
  metric: PlanMetric
  label: string
  operator: PlanTargetOperator | null
  target: number | null
  forecast: number | null
  actual: number | null
  status: PlanMetricStatus
  variancePct: number | null
}

export interface ProjectPlanData {
  period: PlanPeriod
  rows: PlanMetricRow[]
  isPast: boolean
  isCurrent: boolean
}

export const PLAN_METRICS: PlanMetric[] = ['revenue', 'burn', 'cash', 'mrr', 'runway']

export const PLAN_METRIC_LABELS: Record<PlanMetric, string> = {
  revenue: 'Revenue',
  burn: 'Burn',
  cash: 'Cash',
  mrr: 'MRR',
  runway: 'Runway'
}

export const PLAN_METRIC_DEFAULT_OPERATORS: Record<PlanMetric, PlanTargetOperator> = {
  revenue: 'gte',
  burn: 'lte',
  cash: 'gte',
  mrr: 'gte',
  runway: 'gte'
}

export const PLAN_OPERATOR_LABELS: Record<PlanTargetOperator, string> = {
  gte: '≥',
  lte: '≤',
  eq: '='
}
