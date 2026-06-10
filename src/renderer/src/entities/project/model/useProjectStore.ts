import { useSyncExternalStore } from 'react'
import {
  getProject,
  getProjectDashboard,
  getProjectPayments,
  getSnapshot,
  listProjects,
  subscribe
} from './store'
import type { DashboardPeriod } from './types'

export const useProjects = () => useSyncExternalStore(subscribe, () => listProjects())

export const useProject = (projectId: string | undefined) =>
  useSyncExternalStore(subscribe, () => (projectId ? getProject(projectId) : undefined))

export const useProjectPayments = (projectId: string | undefined) =>
  useSyncExternalStore(subscribe, () => (projectId ? getProjectPayments(projectId) : []))

export const useProjectDashboard = (projectId: string | undefined, period: DashboardPeriod) =>
  useSyncExternalStore(subscribe, () =>
    projectId ? getProjectDashboard(projectId, period) : null
  )

export const useProjectStoreVersion = (): number =>
  useSyncExternalStore(
    subscribe,
    () => getSnapshot().projects.length + getSnapshot().payments.length
  )
