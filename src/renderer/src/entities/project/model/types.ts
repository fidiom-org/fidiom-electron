export type PaymentDirection = 'expense' | 'income'
export type PaymentType = 'recurring' | 'one-time'
export type ProjectCurrency = 'USD' | 'EUR' | 'GBP'

export interface DashboardPeriod {
  month: number
  year: number
}

export interface PaymentChangeRecord {
  id: string
  timestamp: string
  summary: string
  reason: string
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
}

export interface CreateProjectInput {
  name: string
  currency: ProjectCurrency
  initialCash?: number
  description?: string
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
