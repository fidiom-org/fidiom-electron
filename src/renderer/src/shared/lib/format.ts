export function formatCurrency(value: number, currency = 'EUR'): string {
  const formatted = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(Math.abs(value))
  return value < 0 ? `-${formatted}` : formatted
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}
