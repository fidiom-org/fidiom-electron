import {
  computeExpenseSlices,
  computeKpi,
  computeMonthlyTotals
} from './compute'
import { computeProjectPlan } from './plan-compute'
import { normalizePlanPeriod, planPeriodStorageKey } from './plan-period'
import type { PlanPeriod } from './plan-period'
import type { PlanTarget, PlanTargetInput, ProjectPlanData } from './plan-types'
import type {
  CreateProjectInput,
  DashboardPeriod,
  DeleteEmployeeInput,
  DeletePaymentInput,
  Employee,
  EmployeeInput,
  Payment,
  PaymentInput,
  Project,
  ProjectDashboardData,
  UpdateEmployeeInput,
  UpdatePaymentInput
} from './types'

type Listener = () => void

interface ProjectStoreState {
  projects: Project[]
  payments: Payment[]
  employees: Employee[]
  planTargets: PlanTarget[]
}

let state: ProjectStoreState = {
  projects: [],
  payments: [],
  employees: [],
  planTargets: []
}

let hydratePromise: Promise<void> | null = null

const listeners = new Set<Listener>()

const emit = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

const applyHydrate = (next: ProjectStoreState): void => {
  state = next
  emit()
}

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = (): ProjectStoreState => state

export const hydrate = async (): Promise<void> => {
  if (!hydratePromise) {
    hydratePromise = window.projectsAPI
      .hydrate()
      .then((data) => {
        applyHydrate(data)
      })
      .finally(() => {
        hydratePromise = null
      })
  }
  await hydratePromise
}

export const listProjects = (): Project[] => state.projects

export const getProject = (projectId: string): Project | undefined =>
  state.projects.find((project) => project.id === projectId)

export const getProjectPayments = (projectId: string): Payment[] =>
  state.payments.filter((payment) => payment.projectId === projectId)

export const getProjectEmployees = (projectId: string): Employee[] =>
  state.employees.filter((employee) => employee.projectId === projectId)

export const getProjectPlanTargets = (projectId: string, period: PlanPeriod): PlanTarget[] => {
  const key = planPeriodStorageKey(period)
  return state.planTargets.filter(
    (target) => target.projectId === projectId && planPeriodStorageKey(target.period) === key
  )
}

export const saveProjectPlanTargets = async (
  projectId: string,
  period: PlanPeriod,
  inputs: PlanTargetInput[]
): Promise<void> => {
  const normalized = normalizePlanPeriod(period)
  const key = planPeriodStorageKey(normalized)
  const saved = await window.projectsAPI.savePlanTargets(projectId, normalized, inputs)

  const rest = state.planTargets.filter(
    (target) => !(target.projectId === projectId && planPeriodStorageKey(target.period) === key)
  )

  state = {
    ...state,
    planTargets: [...rest, ...saved]
  }
  emit()
}

export const getProjectPlan = (projectId: string, period: PlanPeriod): ProjectPlanData | null => {
  const project = getProject(projectId)
  if (!project) return null

  const payments = getProjectPayments(projectId)
  const employees = getProjectEmployees(projectId)
  const targets = getProjectPlanTargets(projectId, period)

  return computeProjectPlan(project, payments, employees, period, targets)
}

export const getProjectDashboard = (
  projectId: string,
  period: DashboardPeriod
): ProjectDashboardData | null => {
  const project = getProject(projectId)
  if (!project) return null

  const payments = getProjectPayments(projectId)
  const employees = getProjectEmployees(projectId)

  return {
    kpi: computeKpi(project, payments, employees, period),
    expenseSlices: computeExpenseSlices(payments, employees, period),
    monthlyTotals: computeMonthlyTotals(payments, employees, period),
    payments,
    employees
  }
}

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  const project = await window.projectsAPI.create({
    ...input,
    type: input.type ?? 'business'
  })
  state = {
    ...state,
    projects: [...state.projects, project]
  }
  emit()
  return project
}

export const addPayment = async (projectId: string, input: PaymentInput): Promise<Payment> => {
  const payment = await window.projectsAPI.addPayment(projectId, input)
  state = {
    ...state,
    payments: [...state.payments, payment]
  }
  emit()
  return payment
}

export const updatePayment = async (
  paymentId: string,
  input: UpdatePaymentInput
): Promise<Payment | null> => {
  const updated = await window.projectsAPI.updatePayment(paymentId, input)
  if (!updated) return null

  const payments = state.payments.map((payment) => (payment.id === paymentId ? updated : payment))
  state = { ...state, payments }
  emit()
  return updated
}

export const deletePayment = async (
  paymentId: string,
  input: DeletePaymentInput
): Promise<Payment | null> => {
  const updated = await window.projectsAPI.deletePayment(paymentId, input)
  if (!updated) return null

  const payments = state.payments.map((payment) => (payment.id === paymentId ? updated : payment))
  state = { ...state, payments }
  emit()
  return updated
}

export const addEmployee = async (projectId: string, input: EmployeeInput): Promise<Employee> => {
  const employee = await window.projectsAPI.addEmployee(projectId, input)
  state = {
    ...state,
    employees: [...state.employees, employee]
  }
  emit()
  return employee
}

export const updateEmployee = async (
  employeeId: string,
  input: UpdateEmployeeInput
): Promise<Employee | null> => {
  const updated = await window.projectsAPI.updateEmployee(employeeId, input)
  if (!updated) return null

  const employees = state.employees.map((employee) =>
    employee.id === employeeId ? updated : employee
  )
  state = { ...state, employees }
  emit()
  return updated
}

export const deleteEmployee = async (
  employeeId: string,
  input: DeleteEmployeeInput
): Promise<Employee | null> => {
  const updated = await window.projectsAPI.deleteEmployee(employeeId, input)
  if (!updated) return null

  const employees = state.employees.map((employee) =>
    employee.id === employeeId ? updated : employee
  )
  state = { ...state, employees }
  emit()
  return updated
}
