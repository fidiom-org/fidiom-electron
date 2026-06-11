import type { PlanTarget } from './plan-types'

const now = (): string => new Date().toISOString()

export const SEED_PLAN_TARGETS: PlanTarget[] = [
  {
    id: 'plan-acme-revenue-jun',
    projectId: 'proj-acme',
    metric: 'revenue',
    targetValue: 12_000,
    operator: 'gte',
    period: { granularity: 'month', month: 6, year: 2026 },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'plan-acme-burn-jun',
    projectId: 'proj-acme',
    metric: 'burn',
    targetValue: 8_500,
    operator: 'lte',
    period: { granularity: 'month', month: 6, year: 2026 },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'plan-acme-runway-jun',
    projectId: 'proj-acme',
    metric: 'runway',
    targetValue: 10,
    operator: 'gte',
    period: { granularity: 'month', month: 6, year: 2026 },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'plan-streampay-revenue-q2',
    projectId: 'proj-streampay',
    metric: 'revenue',
    targetValue: 45_000,
    operator: 'gte',
    period: { granularity: 'quarter', month: 4, year: 2026 },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'plan-streampay-mrr-q2',
    projectId: 'proj-streampay',
    metric: 'mrr',
    targetValue: 12_000,
    operator: 'gte',
    period: { granularity: 'quarter', month: 4, year: 2026 },
    createdAt: now(),
    updatedAt: now()
  }
]
