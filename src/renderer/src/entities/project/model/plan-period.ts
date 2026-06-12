import type { DashboardPeriod } from './types'

export type PlanPeriodGranularity = 'month' | 'quarter'

export interface PlanPeriod {
  granularity: PlanPeriodGranularity
  month: number
  year: number
}

export const quarterStartMonth = (month: number): number => Math.floor((month - 1) / 3) * 3 + 1

export const quarterNumber = (month: number): number => Math.floor((month - 1) / 3) + 1

export const normalizePlanPeriod = (period: PlanPeriod): PlanPeriod => {
  if (period.granularity === 'quarter') {
    return { ...period, month: quarterStartMonth(period.month) }
  }
  return period
}

export const planPeriodStorageKey = (period: PlanPeriod): string => {
  const normalized = normalizePlanPeriod(period)
  return `${normalized.granularity}:${normalized.year}:${normalized.month}`
}

export const expandPlanPeriodToMonths = (period: PlanPeriod): DashboardPeriod[] => {
  const normalized = normalizePlanPeriod(period)

  if (normalized.granularity === 'month') {
    return [{ month: normalized.month, year: normalized.year }]
  }

  const start = normalized.month
  return [0, 1, 2].map((offset) => ({
    month: start + offset,
    year: normalized.year
  }))
}

export const formatPlanPeriodLabel = (period: PlanPeriod): string => {
  const normalized = normalizePlanPeriod(period)

  if (normalized.granularity === 'month') {
    return new Date(normalized.year, normalized.month - 1).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric'
    })
  }

  return `Q${quarterNumber(normalized.month)} ${normalized.year}`
}

export const isPlanPeriodPast = (period: PlanPeriod): boolean => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const months = expandPlanPeriodToMonths(period)
  const last = months[months.length - 1]

  return last.year < currentYear || (last.year === currentYear && last.month < currentMonth)
}

export const isPlanPeriodCurrent = (period: PlanPeriod): boolean => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  return expandPlanPeriodToMonths(period).some(
    (month) => month.month === currentMonth && month.year === currentYear
  )
}

export const planPeriodEquals = (a: PlanPeriod, b: PlanPeriod): boolean =>
  a.granularity === b.granularity && a.month === b.month && a.year === b.year
