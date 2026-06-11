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

export function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${Math.round(bytes / 1024 ** 2)} MB`
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
