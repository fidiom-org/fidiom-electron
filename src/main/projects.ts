import { randomUUID } from 'crypto'
import * as secureStore from './secure-store'
import { summarizeEmployeeChanges, summarizePaymentChanges } from './finance-compute'
import type {
  ChangeRecord,
  CreateProjectInput,
  DeleteEmployeeInput,
  DeletePaymentInput,
  Employee,
  EmployeeInput,
  Payment,
  PaymentInput,
  PlanPeriod,
  PlanTarget,
  PlanTargetInput,
  Project,
  UpdateEmployeeInput,
  UpdatePaymentInput
} from './finance-types'
import { normalizePlanPeriod, planPeriodStorageKey } from './finance-plan-period'

interface ProjectRow {
  id: number
  name: string
  type: 'personal' | 'business'
  currency: string
  description: string | null
  initial_cash: number
  created_at: string
}

interface PaymentRow {
  id: string
  project_id: number
  direction: 'expense' | 'income'
  vendor: string
  amount: number
  type: 'recurring' | 'one-time'
  category: string
  date: string | null
  billing_day: number | null
  note: string | null
  deleted_at: string | null
  created_at: string
}

interface EmployeeRow {
  id: string
  project_id: number
  name: string
  salary: number
  deleted_at: string | null
  created_at: string
}

interface PlanTargetRow {
  id: string
  project_id: number
  metric: PlanTarget['metric']
  target_value: number
  operator: PlanTarget['operator']
  period_granularity: PlanPeriod['granularity']
  period_month: number
  period_year: number
  created_at: string
  updated_at: string
}

interface HistoryRow {
  id: string
  payment_id?: string
  employee_id?: string
  timestamp: string
  summary: string
  reason: string
}

export interface HydrateResult {
  projects: Project[]
  payments: Payment[]
  employees: Employee[]
  planTargets: PlanTarget[]
}

const getUserId = (): number => {
  const row = secureStore.query<{ id: number }>('SELECT id FROM users ORDER BY id LIMIT 1')[0]
  if (!row) throw new Error('No user found')
  return row.id
}

const mapProject = (row: ProjectRow): Project => ({
  id: String(row.id),
  name: row.name,
  type: row.type,
  currency: row.currency as Project['currency'],
  initialCash: row.initial_cash,
  description: row.description,
  createdAt: row.created_at
})

const mapPayment = (row: PaymentRow, history: ChangeRecord[]): Payment => ({
  id: row.id,
  projectId: String(row.project_id),
  direction: row.direction,
  vendor: row.vendor,
  amount: row.amount,
  type: row.type,
  category: row.category,
  date: row.date,
  billingDay: row.billing_day,
  note: row.note,
  deletedAt: row.deleted_at,
  history,
  createdAt: row.created_at
})

const mapEmployee = (row: EmployeeRow, history: ChangeRecord[]): Employee => ({
  id: row.id,
  projectId: String(row.project_id),
  name: row.name,
  salary: row.salary,
  deletedAt: row.deleted_at,
  history,
  createdAt: row.created_at
})

const mapPlanTarget = (row: PlanTargetRow): PlanTarget => ({
  id: row.id,
  projectId: String(row.project_id),
  metric: row.metric,
  targetValue: row.target_value,
  operator: row.operator,
  period: {
    granularity: row.period_granularity,
    month: row.period_month,
    year: row.period_year
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const loadPaymentHistory = (): Map<string, ChangeRecord[]> => {
  const rows = secureStore.query<HistoryRow>(
    `SELECT id, payment_id, timestamp, summary, reason
     FROM finance_payment_history
     ORDER BY timestamp DESC`
  )
  const map = new Map<string, ChangeRecord[]>()
  for (const row of rows) {
    if (!row.payment_id) continue
    const list = map.get(row.payment_id) ?? []
    list.push({
      id: row.id,
      timestamp: row.timestamp,
      summary: row.summary,
      reason: row.reason
    })
    map.set(row.payment_id, list)
  }
  return map
}

const loadEmployeeHistory = (): Map<string, ChangeRecord[]> => {
  const rows = secureStore.query<HistoryRow>(
    `SELECT id, employee_id, timestamp, summary, reason
     FROM finance_employee_history
     ORDER BY timestamp DESC`
  )
  const map = new Map<string, ChangeRecord[]>()
  for (const row of rows) {
    if (!row.employee_id) continue
    const list = map.get(row.employee_id) ?? []
    list.push({
      id: row.id,
      timestamp: row.timestamp,
      summary: row.summary,
      reason: row.reason
    })
    map.set(row.employee_id, list)
  }
  return map
}

export const hydrate = (): HydrateResult => {
  const projects = secureStore
    .query<ProjectRow>(
      `SELECT id, name, type, currency, description, initial_cash, created_at
       FROM projects
       ORDER BY created_at ASC, id ASC`
    )
    .map(mapProject)

  const paymentHistory = loadPaymentHistory()
  const payments = secureStore
    .query<PaymentRow>(
      `SELECT id, project_id, direction, vendor, amount, type, category,
              date, billing_day, note, deleted_at, created_at
       FROM finance_payments
       ORDER BY created_at ASC`
    )
    .map((row) => mapPayment(row, paymentHistory.get(row.id) ?? []))

  const employeeHistory = loadEmployeeHistory()
  const employees = secureStore
    .query<EmployeeRow>(
      `SELECT id, project_id, name, salary, deleted_at, created_at
       FROM finance_employees
       ORDER BY created_at ASC`
    )
    .map((row) => mapEmployee(row, employeeHistory.get(row.id) ?? []))

  const planTargets = secureStore
    .query<PlanTargetRow>(
      `SELECT id, project_id, metric, target_value, operator,
              period_granularity, period_month, period_year, created_at, updated_at
       FROM plan_targets
       ORDER BY created_at ASC`
    )
    .map(mapPlanTarget)

  return { projects, payments, employees, planTargets }
}

export const createProject = (input: CreateProjectInput): Project => {
  const userId = getUserId()
  const initialCash = input.initialCash ?? 0
  const description = input.description?.trim() || null

  secureStore.exec(
    `INSERT INTO projects (user_id, name, type, currency, description, initial_cash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, input.name.trim(), input.type ?? 'business', input.currency, description, initialCash]
  )

  const row = secureStore.query<ProjectRow>(
    `SELECT id, name, type, currency, description, initial_cash, created_at
     FROM projects
     WHERE rowid = last_insert_rowid()`
  )[0]

  secureStore.exec(
    `INSERT INTO accounts (project_id, name, type, currency, initial_balance)
     VALUES (?, 'Cash', 'cash', ?, ?)`,
    [row.id, input.currency, initialCash]
  )

  return mapProject(row)
}

export const addPayment = (projectId: string, input: PaymentInput): Payment => {
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  secureStore.exec(
    `INSERT INTO finance_payments
       (id, project_id, direction, vendor, amount, type, category, date, billing_day, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      Number(projectId),
      input.direction,
      input.vendor.trim(),
      input.amount,
      input.type,
      input.category,
      input.date,
      input.billingDay,
      input.note?.trim() || null,
      createdAt
    ]
  )

  const row = secureStore.query<PaymentRow>(
    `SELECT id, project_id, direction, vendor, amount, type, category,
            date, billing_day, note, deleted_at, created_at
     FROM finance_payments WHERE id = ?`,
    [id]
  )[0]

  return mapPayment(row, [])
}

export const updatePayment = (paymentId: string, input: UpdatePaymentInput): Payment | null => {
  const before = secureStore.query<PaymentRow>(
    `SELECT id, project_id, direction, vendor, amount, type, category,
            date, billing_day, note, deleted_at, created_at
     FROM finance_payments WHERE id = ?`,
    [paymentId]
  )[0]
  if (!before || before.deleted_at) return null

  const beforePayment = mapPayment(before, [])
  const summary = summarizePaymentChanges(beforePayment, input)
  if (!summary) return beforePayment

  secureStore.exec(
    `UPDATE finance_payments
     SET vendor = ?, amount = ?, type = ?, category = ?, date = ?, billing_day = ?, note = ?
     WHERE id = ?`,
    [
      input.vendor.trim(),
      input.amount,
      input.type,
      input.category,
      input.date,
      input.billingDay,
      input.note?.trim() || null,
      paymentId
    ]
  )

  const historyId = randomUUID()
  secureStore.exec(
    `INSERT INTO finance_payment_history (id, payment_id, timestamp, summary, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, paymentId, new Date().toISOString(), summary, input.reason.trim()]
  )

  const row = secureStore.query<PaymentRow>(
    `SELECT id, project_id, direction, vendor, amount, type, category,
            date, billing_day, note, deleted_at, created_at
     FROM finance_payments WHERE id = ?`,
    [paymentId]
  )[0]

  const history = loadPaymentHistory().get(paymentId) ?? []
  return mapPayment(row, history)
}

export const deletePayment = (paymentId: string, input: DeletePaymentInput): Payment | null => {
  const before = secureStore.query<PaymentRow>(
    `SELECT id, project_id, direction, vendor, amount, type, category,
            date, billing_day, note, deleted_at, created_at
     FROM finance_payments WHERE id = ?`,
    [paymentId]
  )[0]
  if (!before || before.deleted_at) return null

  const deletedAt = new Date().toISOString()
  secureStore.exec(`UPDATE finance_payments SET deleted_at = ? WHERE id = ?`, [
    deletedAt,
    paymentId
  ])

  const historyId = randomUUID()
  secureStore.exec(
    `INSERT INTO finance_payment_history (id, payment_id, timestamp, summary, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, paymentId, deletedAt, 'deleted', input.reason.trim()]
  )

  const row = secureStore.query<PaymentRow>(
    `SELECT id, project_id, direction, vendor, amount, type, category,
            date, billing_day, note, deleted_at, created_at
     FROM finance_payments WHERE id = ?`,
    [paymentId]
  )[0]

  const history = loadPaymentHistory().get(paymentId) ?? []
  return mapPayment(row, history)
}

export const addEmployee = (projectId: string, input: EmployeeInput): Employee => {
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  secureStore.exec(
    `INSERT INTO finance_employees (id, project_id, name, salary, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, Number(projectId), input.name.trim(), input.salary, createdAt]
  )

  const row = secureStore.query<EmployeeRow>(
    `SELECT id, project_id, name, salary, deleted_at, created_at
     FROM finance_employees WHERE id = ?`,
    [id]
  )[0]

  return mapEmployee(row, [])
}

export const updateEmployee = (employeeId: string, input: UpdateEmployeeInput): Employee | null => {
  const before = secureStore.query<EmployeeRow>(
    `SELECT id, project_id, name, salary, deleted_at, created_at
     FROM finance_employees WHERE id = ?`,
    [employeeId]
  )[0]
  if (!before || before.deleted_at) return null

  const beforeEmployee = mapEmployee(before, [])
  const summary = summarizeEmployeeChanges(beforeEmployee, input)
  if (!summary) return beforeEmployee

  secureStore.exec(`UPDATE finance_employees SET name = ?, salary = ? WHERE id = ?`, [
    input.name.trim(),
    input.salary,
    employeeId
  ])

  const historyId = randomUUID()
  secureStore.exec(
    `INSERT INTO finance_employee_history (id, employee_id, timestamp, summary, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, employeeId, new Date().toISOString(), summary, input.reason.trim()]
  )

  const row = secureStore.query<EmployeeRow>(
    `SELECT id, project_id, name, salary, deleted_at, created_at
     FROM finance_employees WHERE id = ?`,
    [employeeId]
  )[0]

  const history = loadEmployeeHistory().get(employeeId) ?? []
  return mapEmployee(row, history)
}

export const deleteEmployee = (employeeId: string, input: DeleteEmployeeInput): Employee | null => {
  const before = secureStore.query<EmployeeRow>(
    `SELECT id, project_id, name, salary, deleted_at, created_at
     FROM finance_employees WHERE id = ?`,
    [employeeId]
  )[0]
  if (!before || before.deleted_at) return null

  const deletedAt = new Date().toISOString()
  secureStore.exec(`UPDATE finance_employees SET deleted_at = ? WHERE id = ?`, [
    deletedAt,
    employeeId
  ])

  const historyId = randomUUID()
  secureStore.exec(
    `INSERT INTO finance_employee_history (id, employee_id, timestamp, summary, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, employeeId, deletedAt, 'deleted', input.reason.trim()]
  )

  const row = secureStore.query<EmployeeRow>(
    `SELECT id, project_id, name, salary, deleted_at, created_at
     FROM finance_employees WHERE id = ?`,
    [employeeId]
  )[0]

  const history = loadEmployeeHistory().get(employeeId) ?? []
  return mapEmployee(row, history)
}

export const savePlanTargets = (
  projectId: string,
  period: PlanPeriod,
  inputs: PlanTargetInput[]
): PlanTarget[] => {
  const normalized = normalizePlanPeriod(period)
  const key = planPeriodStorageKey(normalized)
  const timestamp = new Date().toISOString()

  const existing = secureStore.query<PlanTargetRow>(
    `SELECT id, project_id, metric, target_value, operator,
            period_granularity, period_month, period_year, created_at, updated_at
     FROM plan_targets
     WHERE project_id = ?`,
    [Number(projectId)]
  )

  const toDelete = existing.filter(
    (row) =>
      planPeriodStorageKey({
        granularity: row.period_granularity,
        month: row.period_month,
        year: row.period_year
      }) === key
  )

  for (const row of toDelete) {
    secureStore.exec('DELETE FROM plan_targets WHERE id = ?', [row.id])
  }

  const inserted: PlanTarget[] = []
  for (const input of inputs) {
    const id = randomUUID()
    secureStore.exec(
      `INSERT INTO plan_targets
         (id, project_id, metric, target_value, operator,
          period_granularity, period_month, period_year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        Number(projectId),
        input.metric,
        input.targetValue,
        input.operator,
        normalized.granularity,
        normalized.month,
        normalized.year,
        timestamp,
        timestamp
      ]
    )
    inserted.push({
      id,
      projectId,
      metric: input.metric,
      targetValue: input.targetValue,
      operator: input.operator,
      period: normalized,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  }

  return inserted
}
