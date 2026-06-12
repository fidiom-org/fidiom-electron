import {
  computeExpenseSlices,
  computeKpi,
  computeMonthlyTotals,
  summarizeEmployeeChanges,
  summarizePaymentChanges
} from './compute'
import { computeProjectPlan } from './plan-compute'
import { normalizePlanPeriod, planPeriodStorageKey } from './plan-period'
import type { PlanPeriod } from './plan-period'
import { SEED_PLAN_TARGETS } from './plan-seed'
import type { PlanTarget, PlanTargetInput, ProjectPlanData } from './plan-types'
import { SEED_EMPLOYEES, SEED_PAYMENTS, SEED_PROJECTS } from './seed'
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

const createId = (): string => crypto.randomUUID()

let state: ProjectStoreState = {
  projects: [...SEED_PROJECTS],
  payments: [...SEED_PAYMENTS],
  employees: [...SEED_EMPLOYEES],
  planTargets: [...SEED_PLAN_TARGETS]
}

const listeners = new Set<Listener>()

const emit = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = (): ProjectStoreState => state

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

export const saveProjectPlanTargets = (
  projectId: string,
  period: PlanPeriod,
  inputs: PlanTargetInput[]
): void => {
  const normalized = normalizePlanPeriod(period)
  const key = planPeriodStorageKey(normalized)
  const timestamp = new Date().toISOString()

  const rest = state.planTargets.filter(
    (target) => !(target.projectId === projectId && planPeriodStorageKey(target.period) === key)
  )

  const next = inputs.map((input) => ({
    id: createId(),
    projectId,
    metric: input.metric,
    targetValue: input.targetValue,
    operator: input.operator,
    period: normalized,
    createdAt: timestamp,
    updatedAt: timestamp
  }))

  state = {
    ...state,
    planTargets: [...rest, ...next]
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

export const createProject = (input: CreateProjectInput): Project => {
  const project: Project = {
    id: createId(),
    name: input.name.trim(),
    currency: input.currency,
    initialCash: input.initialCash ?? 0,
    description: input.description?.trim() || null,
    createdAt: new Date().toISOString()
  }

  state = {
    ...state,
    projects: [...state.projects, project]
  }
  emit()
  return project
}

export const addPayment = (projectId: string, input: PaymentInput): Payment => {
  const payment: Payment = {
    id: createId(),
    projectId,
    direction: input.direction,
    vendor: input.vendor.trim(),
    amount: input.amount,
    type: input.type,
    category: input.category,
    date: input.date,
    billingDay: input.billingDay,
    note: input.note?.trim() || null,
    deletedAt: null,
    history: [],
    createdAt: new Date().toISOString()
  }

  state = {
    ...state,
    payments: [...state.payments, payment]
  }
  emit()
  return payment
}

export const updatePayment = (paymentId: string, input: UpdatePaymentInput): Payment | null => {
  const index = state.payments.findIndex((payment) => payment.id === paymentId)
  if (index === -1) return null

  const before = state.payments[index]
  const summary = summarizePaymentChanges(before, input)
  if (!summary) return before

  const updated: Payment = {
    ...before,
    vendor: input.vendor.trim(),
    amount: input.amount,
    type: input.type,
    category: input.category,
    date: input.date,
    billingDay: input.billingDay,
    note: input.note?.trim() || null,
    history: [
      {
        id: createId(),
        timestamp: new Date().toISOString(),
        summary,
        reason: input.reason.trim()
      },
      ...before.history
    ]
  }

  const payments = [...state.payments]
  payments[index] = updated
  state = { ...state, payments }
  emit()
  return updated
}

export const deletePayment = (paymentId: string, input: DeletePaymentInput): Payment | null => {
  const index = state.payments.findIndex((payment) => payment.id === paymentId)
  if (index === -1) return null

  const before = state.payments[index]
  const updated: Payment = {
    ...before,
    deletedAt: new Date().toISOString(),
    history: [
      {
        id: createId(),
        timestamp: new Date().toISOString(),
        summary: 'deleted',
        reason: input.reason.trim()
      },
      ...before.history
    ]
  }

  const payments = [...state.payments]
  payments[index] = updated
  state = { ...state, payments }
  emit()
  return updated
}

export const addEmployee = (projectId: string, input: EmployeeInput): Employee => {
  const employee: Employee = {
    id: createId(),
    projectId,
    name: input.name.trim(),
    salary: input.salary,
    deletedAt: null,
    history: [],
    createdAt: new Date().toISOString()
  }

  state = {
    ...state,
    employees: [...state.employees, employee]
  }
  emit()
  return employee
}

export const updateEmployee = (employeeId: string, input: UpdateEmployeeInput): Employee | null => {
  const index = state.employees.findIndex((employee) => employee.id === employeeId)
  if (index === -1) return null

  const before = state.employees[index]
  const summary = summarizeEmployeeChanges(before, input)
  if (!summary) return before

  const updated: Employee = {
    ...before,
    name: input.name.trim(),
    salary: input.salary,
    history: [
      {
        id: createId(),
        timestamp: new Date().toISOString(),
        summary,
        reason: input.reason.trim()
      },
      ...before.history
    ]
  }

  const employees = [...state.employees]
  employees[index] = updated
  state = { ...state, employees }
  emit()
  return updated
}

export const deleteEmployee = (employeeId: string, input: DeleteEmployeeInput): Employee | null => {
  const index = state.employees.findIndex((employee) => employee.id === employeeId)
  if (index === -1) return null

  const before = state.employees[index]
  const updated: Employee = {
    ...before,
    deletedAt: new Date().toISOString(),
    history: [
      {
        id: createId(),
        timestamp: new Date().toISOString(),
        summary: 'deleted',
        reason: input.reason.trim()
      },
      ...before.history
    ]
  }

  const employees = [...state.employees]
  employees[index] = updated
  state = { ...state, employees }
  emit()
  return updated
}
