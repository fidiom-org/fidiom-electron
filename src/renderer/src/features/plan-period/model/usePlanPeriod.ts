import { useState } from 'react'
import type { PlanPeriod, PlanPeriodGranularity } from '@renderer/entities/project'
import { normalizePlanPeriod, quarterStartMonth } from '@renderer/entities/project'

export const usePlanPeriod = (): PlanPeriod & {
  setGranularity: (granularity: PlanPeriodGranularity) => void
  setFromMonthInput: (value: string) => void
} => {
  const now = new Date()
  const [granularity, setGranularityState] = useState<PlanPeriodGranularity>('month')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const setGranularity = (next: PlanPeriodGranularity): void => {
    setGranularityState(next)
    if (next === 'quarter') {
      setMonth((current) => quarterStartMonth(current))
    }
  }

  const setFromMonthInput = (value: string): void => {
    const [y, m] = value.split('-').map(Number)
    if (!y || !m) return

    setYear(y)
    setMonth(granularity === 'quarter' ? quarterStartMonth(m) : m)
  }

  const period = normalizePlanPeriod({ granularity, month, year })

  return {
    ...period,
    setGranularity,
    setFromMonthInput
  }
}
