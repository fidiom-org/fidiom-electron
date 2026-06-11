import { useSyncExternalStore } from 'react'
import {
  computeExpenseSlices,
  computeKpi,
  computeMonthlyTotals
} from './compute'
import { getSnapshot, subscribe } from './store'
import type { DashboardPeriod, Payment, Project, ProjectDashboardData } from './types'

export const useProjects = (): Project[] => {
  const { projects } = useSyncExternalStore(subscribe, getSnapshot)
  return projects
}

export const useProject = (projectId: string | undefined): Project | undefined => {
  const { projects } = useSyncExternalStore(subscribe, getSnapshot)
  if (!projectId) return undefined
  return projects.find((project) => project.id === projectId)
}

export const useProjectPayments = (projectId: string | undefined): Payment[] => {
  const { payments } = useSyncExternalStore(subscribe, getSnapshot)
  if (!projectId) return []
  return payments.filter((payment) => payment.projectId === projectId)
}

export const useProjectDashboard = (
  projectId: string | undefined,
  period: DashboardPeriod
): ProjectDashboardData | null => {
  const { projects, payments } = useSyncExternalStore(subscribe, getSnapshot)
  if (!projectId) return null

  const project = projects.find((item) => item.id === projectId)
  if (!project) return null

  const projectPayments = payments.filter((payment) => payment.projectId === projectId)

  return {
    kpi: computeKpi(project, projectPayments, period),
    expenseSlices: computeExpenseSlices(projectPayments, period),
    monthlyTotals: computeMonthlyTotals(projectPayments, period),
    payments: projectPayments
  }
}
