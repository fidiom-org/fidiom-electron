import { useEffect, useState } from 'react'
import { dashboardApi } from '../api'
import type { DashboardData, DashboardPeriod } from './types'

export function useDashboardData(period: DashboardPeriod): {
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
      .getData({ month, year })
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [month, year])

  return { data, loading }
}
