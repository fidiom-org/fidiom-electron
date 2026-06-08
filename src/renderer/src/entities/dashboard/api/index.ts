import { mockDashboardApi } from './dashboard-api.mock'

/** Swap mockDashboardApi for a db-backed implementation when ready. */
export const dashboardApi = mockDashboardApi

export type { DashboardApi } from './dashboard-api'
