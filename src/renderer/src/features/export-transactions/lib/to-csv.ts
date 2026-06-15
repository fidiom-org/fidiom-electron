import type { TransactionListItem } from '@renderer/entities/transaction'

const HEADERS = ['Date', 'Type', 'Category', 'Description', 'Amount'] as const

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toRow(item: TransactionListItem): string {
  const cells = [
    item.date,
    item.type,
    item.category?.label ?? '',
    item.description ?? '',
    String(item.amount)
  ]
  return cells.map(escapeCell).join(',')
}

export function toCsv(items: TransactionListItem[]): string {
  const lines = [HEADERS.join(','), ...items.map(toRow)]
  return lines.join('\r\n')
}
