import type {
  CategorySlice,
  DashboardPeriod,
  MonthlyTotals,
  Payment,
  PaymentInput,
  Project,
  ProjectKpi
} from './types'

const isInPeriod = (period: DashboardPeriod, dateStr: string): boolean => {
  const date = new Date(dateStr)
  return date.getFullYear() === period.year && date.getMonth() + 1 === period.month
}

export const paymentAppliesInPeriod = (payment: Payment, period: DashboardPeriod): boolean => {
  if (payment.deletedAt) return false
  if (payment.type === 'recurring') return true
  return payment.date ? isInPeriod(period, payment.date) : false
}

export const getPaymentsInPeriod = (
  payments: Payment[],
  period: DashboardPeriod,
  direction?: Payment['direction']
): Payment[] =>
  payments.filter(
    (p) =>
      !p.deletedAt &&
      (direction === undefined || p.direction === direction) &&
      paymentAppliesInPeriod(p, period)
  )

const sumPayments = (payments: Payment[]): number =>
  payments.reduce((total, payment) => total + payment.amount, 0)

export const computeBurn = (payments: Payment[], period: DashboardPeriod): number =>
  sumPayments(getPaymentsInPeriod(payments, period, 'expense'))

export const computeRevenue = (payments: Payment[], period: DashboardPeriod): number =>
  sumPayments(getPaymentsInPeriod(payments, period, 'income'))

export const computeMrr = (payments: Payment[], period: DashboardPeriod): number =>
  sumPayments(
    getPaymentsInPeriod(payments, period, 'income').filter(
      (payment) => payment.type === 'recurring'
    )
  )

const netFlowUpToPeriod = (payments: Payment[], period: DashboardPeriod): number => {
  const cutoff = new Date(period.year, period.month, 0, 23, 59, 59)
  let net = 0

  for (const payment of payments) {
    if (payment.deletedAt) continue

    if (payment.type === 'recurring') {
      const months =
        (period.year - new Date(payment.createdAt).getFullYear()) * 12 +
        (period.month - (new Date(payment.createdAt).getMonth() + 1)) +
        1
      if (months > 0) {
        const signed = payment.direction === 'income' ? payment.amount : -payment.amount
        net += signed * months
      }
      continue
    }

    if (payment.date) {
      const date = new Date(payment.date)
      if (date <= cutoff) {
        net += payment.direction === 'income' ? payment.amount : -payment.amount
      }
    }
  }

  return net
}

export const computeCash = (
  project: Project,
  payments: Payment[],
  period: DashboardPeriod
): number => project.initialCash + netFlowUpToPeriod(payments, period)

export const computeRunway = (cash: number, burn: number): number | null => {
  if (burn <= 0) return null
  return Math.round((cash / burn) * 10) / 10
}

export const computeKpi = (
  project: Project,
  payments: Payment[],
  period: DashboardPeriod
): ProjectKpi => {
  const burn = computeBurn(payments, period)
  const cash = computeCash(project, payments, period)

  return {
    burn,
    cash,
    runwayMonths: computeRunway(cash, burn),
    revenue: computeRevenue(payments, period),
    mrr: computeMrr(payments, period)
  }
}

export const computeExpenseSlices = (
  payments: Payment[],
  period: DashboardPeriod
): CategorySlice[] => {
  const totals = new Map<string, number>()

  for (const payment of getPaymentsInPeriod(payments, period, 'expense')) {
    totals.set(payment.category, (totals.get(payment.category) ?? 0) + payment.amount)
  }

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

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

export const computeMonthlyTotals = (
  payments: Payment[],
  anchor: DashboardPeriod,
  count = 6
): MonthlyTotals[] => {
  const months: DashboardPeriod[] = []
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftPeriod(anchor, -i))
  }

  return months.map((period) => ({
    period: `${period.month}/${period.year}`,
    expenses: computeBurn(payments, period),
    income: computeRevenue(payments, period)
  }))
}

export const formatPaymentField = (value: string | number | null): string => {
  if (value === null || value === '') return '—'
  return String(value)
}

export const summarizePaymentChanges = (before: Payment, after: PaymentInput): string | null => {
  const fields: Array<{ key: keyof PaymentInput; label: string }> = [
    { key: 'vendor', label: 'vendor' },
    { key: 'amount', label: 'amount' },
    { key: 'type', label: 'type' },
    { key: 'category', label: 'category' },
    { key: 'date', label: 'date' },
    { key: 'billingDay', label: 'billing day' },
    { key: 'note', label: 'note' }
  ]

  const changes: string[] = []

  for (const { key, label } of fields) {
    const oldValue = before[key as keyof Payment]
    const newValue = after[key]
    if (oldValue !== newValue) {
      changes.push(
        `${label}: ${formatPaymentField(oldValue as string | number | null)} → ${formatPaymentField(newValue)}`
      )
    }
  }

  return changes.length > 0 ? changes.join(', ') : null
}
