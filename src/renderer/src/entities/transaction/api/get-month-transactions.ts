import { DEFAULT_CATEGORY_OPTIONS } from '../model/categories'
import type { TransactionListItem, TransactionType } from '../model/types'

export interface TransactionRow {
  id: number
  amount: number
  type: TransactionType
  date: string
  description: string | null
  categoryName: string | null
}

const LIST_SQL = `
  SELECT t.id, t.amount, t.type, t.date, t.description, c.name AS categoryName
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.date >= ? AND t.date < ?
  ORDER BY t.date DESC, t.created_at DESC, t.id DESC
`

export function mapTransactionRow(row: TransactionRow): TransactionListItem {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    date: row.date,
    description: row.description,
    category: DEFAULT_CATEGORY_OPTIONS.find((option) => option.label === row.categoryName) ?? null
  }
}

function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export async function getMonthTransactions(
  month: number,
  year: number
): Promise<TransactionListItem[]> {
  const start = monthStart(year, month)
  const end = month === 12 ? monthStart(year + 1, 1) : monthStart(year, month + 1)
  const rows = await window.dbAPI.query<TransactionRow>(LIST_SQL, [start, end])

  return rows.map(mapTransactionRow)
}
