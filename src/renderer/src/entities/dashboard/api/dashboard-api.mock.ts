import type { DashboardApi } from './dashboard-api'
import type { DashboardData, DashboardPeriod, FinanceMode } from '../model/types'

function periodSeed(period: DashboardPeriod): number {
  return period.year * 12 + period.month
}

function pseudo(seed: number, offset: number): number {
  return ((seed * 9301 + offset * 49297) % 233280) / 233280
}

function recentMonths(period: DashboardPeriod, count: number): DashboardPeriod[] {
  const months: DashboardPeriod[] = []
  for (let i = count - 1; i >= 0; i--) {
    let month = period.month - i
    let year = period.year
    while (month <= 0) {
      month += 12
      year -= 1
    }
    months.push({ month, year })
  }
  return months
}

function previousPeriod(period: DashboardPeriod): DashboardPeriod {
  let month = period.month - 1
  let year = period.year
  if (month <= 0) {
    month = 12
    year -= 1
  }
  return { month, year }
}

function monthlyExpenseTotal(period: DashboardPeriod, mode: FinanceMode): number {
  const seed = periodSeed(period)
  const base = mode === 'business' ? 14000 : 2800
  const seasonal = Math.round(Math.sin((period.month / 12) * Math.PI * 2) * (mode === 'business' ? 2500 : 500))
  const yearDrift = (period.year - 2025) * (mode === 'business' ? 800 : 200)
  const noise = Math.round(pseudo(seed, 5) * (mode === 'business' ? 4000 : 900))
  return base + seasonal + yearDrift + noise
}

function createMockDashboardData(period: DashboardPeriod, mode: FinanceMode): DashboardData {
  const seed = periodSeed(period)
  const isBusiness = mode === 'business'
  const operatingFunds = Math.round(
    (isBusiness ? 42000 : 9200) + pseudo(seed, 1) * (isBusiness ? 25000 : 6000)
  )
  const investing = Math.round(pseudo(seed, 2) * (isBusiness ? 120000 : 18000))
  const debt = -Math.round(
    (isBusiness ? 85000 : 12000) + pseudo(seed, 3) * (isBusiness ? 40000 : 8000)
  )
  const netWorth = operatingFunds + investing + debt

  const currentTotal = monthlyExpenseTotal(period, mode)
  const prev = previousPeriod(period)
  const previousTotal = monthlyExpenseTotal(prev, mode)
  const changePercent = Math.round(((currentTotal - previousTotal) / previousTotal) * 100)

  const personalCategories = ['Groceries', 'Transport', 'Utilities', 'Entertainment', 'Health']
  const businessCategories = ['Payroll', 'SaaS', 'Marketing', 'Office', 'Contractors']
  const categories = isBusiness ? businessCategories : personalCategories

  const categorySlices = categories.map((name, i) => ({
    name,
    value: Math.round(currentTotal * (0.12 + pseudo(seed, 20 + i) * 0.18))
  }))

  const sortedCategories = [...categorySlices].sort((a, b) => b.value - a.value)
  const topCategories = sortedCategories.slice(0, 4).map((c) => ({
    name: c.name,
    amount: c.value,
    sharePercent: Math.round((c.value / currentTotal) * 100)
  }))

  return {
    summary: {
      operatingFunds,
      investing,
      debt,
      netWorth
    },
    expensesOverTime: recentMonths(period, 6).map((m) => ({
      period: `${m.month}/${m.year}`,
      amount: monthlyExpenseTotal(m, mode)
    })),
    expensesByCategory: categorySlices,
    periodComparison: {
      currentLabel: `${period.month}/${period.year}`,
      previousLabel: `${prev.month}/${prev.year}`,
      currentTotal,
      previousTotal,
      changePercent
    },
    topCategories,
    anomalies: [
      {
        id: '1',
        description: isBusiness ? 'Payroll 22% above average' : 'Groceries spike detected',
        amount: Math.round(currentTotal * 0.18),
        severity: pseudo(seed, 70) > 0.6 ? 'high' : 'medium'
      },
      {
        id: '2',
        description: isBusiness ? 'SaaS renewal cluster' : 'Unusual transport spending',
        amount: Math.round(currentTotal * 0.09),
        severity: 'low'
      }
    ],
    runway: isBusiness
      ? {
          monthsRemaining: Math.round(4 + pseudo(seed, 60) * 14),
          monthlyBurn: Math.round(12000 + pseudo(seed, 61) * 18000),
          cashOnHand: operatingFunds
        }
      : null
  }
}

export const mockDashboardApi: DashboardApi = {
  getData: async (period, mode) => createMockDashboardData(period, mode)
}
