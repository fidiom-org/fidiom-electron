import type { DashboardApi } from './dashboard-api'
import { computeDashboardData } from '../model/compute-dashboard'

export const dbDashboardApi: DashboardApi = {
  getData: async (period, mode) => {
    const { projects, payments, employees } = await window.projectsAPI.hydrate()
    return computeDashboardData(period, mode, projects, payments, employees)
  }
}
