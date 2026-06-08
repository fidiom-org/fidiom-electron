export type FinanceMode = 'personal' | 'business'

export interface DashboardPeriod {
  month: number
  year: number
}

export interface DashboardSummary {
  operatingFunds: number
  investing: number
  debt: number
  netWorth: number
}

export interface ExpensePoint {
  period: string
  amount: number
}

export interface DistributionSlice {
  name: string
  value: number
}

export interface PeriodComparison {
  currentLabel: string
  previousLabel: string
  currentTotal: number
  previousTotal: number
  changePercent: number
}

export interface TopCategory {
  name: string
  amount: number
  sharePercent: number
}

export interface SpendingAnomaly {
  id: string
  description: string
  amount: number
  severity: 'low' | 'medium' | 'high'
}

export interface RunwayInfo {
  monthsRemaining: number
  monthlyBurn: number
  cashOnHand: number
}

export interface DashboardData {
  summary: DashboardSummary
  expensesOverTime: ExpensePoint[]
  expensesByCategory: DistributionSlice[]
  periodComparison: PeriodComparison
  topCategories: TopCategory[]
  anomalies: SpendingAnomaly[]
  runway: RunwayInfo | null
}
