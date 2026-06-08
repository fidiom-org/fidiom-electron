import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'
import type { DashboardData, DashboardPeriod, FinanceMode } from './types'

export function useDashboardData(
  period: DashboardPeriod,
  mode: FinanceMode
): {
  data: DashboardData | null
  loading: boolean
} {
  const { month, year } = period
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    dashboardApi
      .getData({ month, year }, mode)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [month, year, mode])

  return { data, loading }
}
