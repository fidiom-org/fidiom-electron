import type Database from 'better-sqlite3-multiple-ciphers'
import {
  DEMO_EMPLOYEES,
  DEMO_PAYMENTS,
  DEMO_PLAN_TARGETS,
  DEMO_PROJECTS,
  type DemoProjectKey
} from './demo-seed'

export interface SeedDemoResult {
  inserted: boolean
  message: string
}

const getUserId = (conn: Database.Database): number => {
  const row = conn.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get() as
    | { id: number }
    | undefined
  if (!row) throw new Error('No user found — set up auth first')
  return row.id
}

const seedWithConnection = (conn: Database.Database): SeedDemoResult => {
  const existing = conn
    .prepare("SELECT id FROM projects WHERE name = 'Acme Labs' LIMIT 1")
    .get() as { id: number } | undefined
  if (existing) {
    return { inserted: false, message: 'Demo data already present (Acme Labs exists)' }
  }

  const userId = getUserId(conn)
  const projectIds = new Map<DemoProjectKey, number>()
  const now = new Date().toISOString()

  const insertProject = conn.prepare(
    `INSERT INTO projects (user_id, name, type, currency, description, initial_cash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertAccount = conn.prepare(
    `INSERT INTO accounts (project_id, name, type, currency, initial_balance)
     VALUES (?, 'Cash', 'cash', ?, ?)`
  )

  for (const project of DEMO_PROJECTS) {
    const result = insertProject.run(
      userId,
      project.name,
      project.type,
      project.currency,
      project.description,
      project.initialCash,
      now
    )
    const projectId = Number(result.lastInsertRowid)
    projectIds.set(project.key, projectId)
    insertAccount.run(projectId, project.currency, project.initialCash)
  }

  const insertPayment = conn.prepare(
    `INSERT INTO finance_payments
       (id, project_id, direction, vendor, amount, type, category, date, billing_day, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const payment of DEMO_PAYMENTS) {
    const projectId = projectIds.get(payment.projectKey)
    if (!projectId) continue
    insertPayment.run(
      payment.id,
      projectId,
      payment.direction,
      payment.vendor,
      payment.amount,
      payment.type,
      payment.category,
      payment.date,
      payment.billingDay,
      payment.note,
      payment.createdAt
    )
  }

  const insertEmployee = conn.prepare(
    `INSERT INTO finance_employees (id, project_id, name, salary, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )

  for (const employee of DEMO_EMPLOYEES) {
    const projectId = projectIds.get(employee.projectKey)
    if (!projectId) continue
    insertEmployee.run(employee.id, projectId, employee.name, employee.salary, employee.createdAt)
  }

  const insertPlanTarget = conn.prepare(
    `INSERT INTO plan_targets
       (id, project_id, metric, target_value, operator,
        period_granularity, period_month, period_year, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const target of DEMO_PLAN_TARGETS) {
    const projectId = projectIds.get(target.projectKey)
    if (!projectId) continue
    insertPlanTarget.run(
      target.id,
      projectId,
      target.metric,
      target.targetValue,
      target.operator,
      target.periodGranularity,
      target.periodMonth,
      target.periodYear,
      now,
      now
    )
  }

  return {
    inserted: true,
    message: `Inserted ${DEMO_PROJECTS.length} projects with payments, employees, and plan targets`
  }
}

export const seedDemoDataWithConnection = (conn: Database.Database): SeedDemoResult =>
  conn.transaction(() => seedWithConnection(conn))()
