export type PaymentDirection = 'expense' | 'income'
export type PaymentType = 'recurring' | 'one-time'
export type ProjectCurrency = 'USD' | 'EUR' | 'GBP'

export interface DashboardPeriod {
  month: number
  year: number
}

export interface ChangeRecord {
  id: string
  timestamp: string
  summary: string
  reason: string
}

export type PaymentChangeRecord = ChangeRecord
export type EmployeeChangeRecord = ChangeRecord

export interface Employee {
  id: string
  projectId: string
  name: string
  salary: number
  deletedAt: string | null
  history: EmployeeChangeRecord[]
  createdAt: string
}

export interface Payment {
  id: string
  projectId: string
  direction: PaymentDirection
  vendor: string
  amount: number
  type: PaymentType
  category: string
  date: string | null
  billingDay: number | null
  note: string | null
  deletedAt: string | null
  history: PaymentChangeRecord[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  type: 'personal' | 'business'
  currency: ProjectCurrency
  initialCash: number
  description: string | null
  createdAt: string
}

export interface ProjectKpi {
  burn: number
  cash: number
  runwayMonths: number | null
  revenue: number
  mrr: number
}

export interface CategorySlice {
  name: string
  value: number
}

export interface MonthlyTotals {
  period: string
  expenses: number
  income: number
}

export interface ProjectDashboardData {
  kpi: ProjectKpi
  expenseSlices: CategorySlice[]
  monthlyTotals: MonthlyTotals[]
  payments: Payment[]
  employees: Employee[]
}

export interface EmployeeInput {
  name: string
  salary: number
}

export interface UpdateEmployeeInput extends EmployeeInput {
  reason: string
}

export interface DeleteEmployeeInput {
  reason: string
}

export interface CreateProjectInput {
  name: string
  currency: ProjectCurrency
  initialCash?: number
  description?: string
  type?: 'personal' | 'business'
}

export interface PaymentInput {
  direction: PaymentDirection
  vendor: string
  amount: number
  type: PaymentType
  category: string
  date: string | null
  billingDay: number | null
  note: string | null
}

export interface UpdatePaymentInput extends PaymentInput {
  reason: string
}

export interface DeletePaymentInput {
  reason: string
}
