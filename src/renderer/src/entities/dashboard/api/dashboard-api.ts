import type { DashboardData, DashboardPeriod, FinanceMode } from '../model/types'

export interface DashboardApi {
  getData: (period: DashboardPeriod, mode: FinanceMode) => Promise<DashboardData>
}
