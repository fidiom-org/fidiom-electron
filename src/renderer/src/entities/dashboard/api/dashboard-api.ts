import type { DashboardData, DashboardPeriod } from '../model/types'

export interface DashboardApi {
  getData: (period: DashboardPeriod) => Promise<DashboardData>
}
