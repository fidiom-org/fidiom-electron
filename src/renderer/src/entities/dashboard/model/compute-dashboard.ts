import type { FinanceMode } from '@renderer/entities/dashboard/model/types'
import type {
  DashboardData,
  DashboardPeriod,
  DistributionSlice,
  SpendingAnomaly
} from '@renderer/entities/dashboard/model/types'
import {
  computeBurn,
  computeCash,
  computeExpenseSlices,
  computeRunway
} from '@renderer/entities/project/model/compute'
import type { Employee, Payment, Project } from '@renderer/entities/project/model/types'

const shiftPeriod = (period: DashboardPeriod, offset: number): DashboardPeriod => {
  let month = period.month + offset
  let year = period.year

  while (month <= 0) {
    month += 12
    year -= 1
  }
  while (month > 12) {
    month -= 12
    year += 1
  }

  return { month, year }
}

const previousPeriod = (period: DashboardPeriod): DashboardPeriod => shiftPeriod(period, -1)

const recentMonths = (period: DashboardPeriod, count: number): DashboardPeriod[] => {
  const months: DashboardPeriod[] = []
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftPeriod(period, -i))
  }
  return months
}

const emptyDashboard = (period: DashboardPeriod, mode: FinanceMode): DashboardData => {
  const prev = previousPeriod(period)
  return {
    summary: { operatingFunds: 0, investing: 0, debt: 0, netWorth: 0 },
    expensesOverTime: recentMonths(period, 6).map((m) => ({
      period: `${m.month}/${m.year}`,
      amount: 0
    })),
    expensesByCategory: [],
    periodComparison: {
      currentLabel: `${period.month}/${period.year}`,
      previousLabel: `${prev.month}/${prev.year}`,
      currentTotal: 0,
      previousTotal: 0,
      changePercent: 0
    },
    topCategories: [],
    anomalies: [],
    runway: mode === 'business' ? null : null
  }
}

const mergeSlices = (slices: DistributionSlice[]): DistributionSlice[] => {
  const totals = new Map<string, number>()
  for (const slice of slices) {
    totals.set(slice.name, (totals.get(slice.name) ?? 0) + slice.value)
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const detectAnomalies = (
  payments: Payment[],
  employees: Employee[],
  period: DashboardPeriod
): SpendingAnomaly[] => {
  const current = computeExpenseSlices(payments, employees, period)
  if (current.length === 0) return []

  const history = recentMonths(period, 4).slice(0, 3)
  const anomalies: SpendingAnomaly[] = []

  for (const slice of current) {
    const priorTotals = history.map((month) => {
      const priorSlice = computeExpenseSlices(payments, employees, month)
      return priorSlice.find((item) => item.name === slice.name)?.value ?? 0
    })
    const avg = priorTotals.reduce((sum, value) => sum + value, 0) / priorTotals.length
    if (avg <= 0) continue
    const ratio = slice.value / avg
    if (ratio < 1.35) continue

    anomalies.push({
      id: `${slice.name}-${period.year}-${period.month}`,
      description: `${slice.name} ${Math.round((ratio - 1) * 100)}% above recent average`,
      amount: Math.round(slice.value - avg),
      severity: ratio >= 1.75 ? 'high' : ratio >= 1.5 ? 'medium' : 'low'
    })
  }

  return anomalies.slice(0, 3)
}

export const computeDashboardData = (
  period: DashboardPeriod,
  mode: FinanceMode,
  projects: Project[],
  payments: Payment[],
  employees: Employee[]
): DashboardData => {
  const scopedProjects = projects.filter((project) => project.type === mode)
  if (scopedProjects.length === 0) {
    return emptyDashboard(period, mode)
  }

  const projectIds = new Set(scopedProjects.map((project) => project.id))
  const scopedPayments = payments.filter((payment) => projectIds.has(payment.projectId))
  const scopedEmployees = employees.filter((employee) => projectIds.has(employee.projectId))

  const operatingFunds = scopedProjects.reduce((total, project) => {
    const projectPayments = scopedPayments.filter((payment) => payment.projectId === project.id)
    const projectEmployees = scopedEmployees.filter((employee) => employee.projectId === project.id)
    return total + computeCash(project, projectPayments, projectEmployees, period)
  }, 0)

  const currentTotal = scopedProjects.reduce((total, project) => {
    const projectPayments = scopedPayments.filter((payment) => payment.projectId === project.id)
    const projectEmployees = scopedEmployees.filter((employee) => employee.projectId === project.id)
    return total + computeBurn(projectPayments, projectEmployees, period)
  }, 0)

  const prev = previousPeriod(period)
  const previousTotalActual = scopedProjects.reduce((total, project) => {
    const projectPayments = scopedPayments.filter((payment) => payment.projectId === project.id)
    const projectEmployees = scopedEmployees.filter((employee) => employee.projectId === project.id)
    return total + computeBurn(projectPayments, projectEmployees, prev)
  }, 0)

  const changePercent =
    previousTotalActual === 0
      ? 0
      : Math.round(((currentTotal - previousTotalActual) / previousTotalActual) * 100)

  const expenseSlices = mergeSlices(
    scopedProjects.flatMap((project) => {
      const projectPayments = scopedPayments.filter((payment) => payment.projectId === project.id)
      const projectEmployees = scopedEmployees.filter((employee) => employee.projectId === project.id)
      return computeExpenseSlices(projectPayments, projectEmployees, period)
    })
  )

  const topCategories = expenseSlices.slice(0, 4).map((slice) => ({
    name: slice.name,
    amount: slice.value,
    sharePercent: currentTotal > 0 ? Math.round((slice.value / currentTotal) * 100) : 0
  }))

  const monthlyBurn = scopedProjects.reduce((total, project) => {
    const projectPayments = scopedPayments.filter((payment) => payment.projectId === project.id)
    const projectEmployees = scopedEmployees.filter((employee) => employee.projectId === project.id)
    return total + computeBurn(projectPayments, projectEmployees, period)
  }, 0)

  const runwayMonths = computeRunway(operatingFunds, monthlyBurn)

  return {
    summary: {
      operatingFunds: Math.round(operatingFunds),
      investing: 0,
      debt: 0,
      netWorth: Math.round(operatingFunds)
    },
    expensesOverTime: recentMonths(period, 6).map((month) => ({
      period: `${month.month}/${month.year}`,
      amount: scopedProjects.reduce((total, project) => {
        const projectPayments = scopedPayments.filter((payment) => payment.projectId === project.id)
        const projectEmployees = scopedEmployees.filter(
          (employee) => employee.projectId === project.id
        )
        return total + computeBurn(projectPayments, projectEmployees, month)
      }, 0)
    })),
    expensesByCategory: expenseSlices,
    periodComparison: {
      currentLabel: `${period.month}/${period.year}`,
      previousLabel: `${prev.month}/${prev.year}`,
      currentTotal,
      previousTotal: previousTotalActual,
      changePercent
    },
    topCategories,
    anomalies: detectAnomalies(scopedPayments, scopedEmployees, period),
    runway:
      mode === 'business' && runwayMonths !== null
        ? {
            monthsRemaining: runwayMonths,
            monthlyBurn: Math.round(monthlyBurn),
            cashOnHand: Math.round(operatingFunds)
          }
        : null
  }
}
