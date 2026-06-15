import type { TransactionListItem } from '../model/types'
import { mapTransactionRow, type TransactionRow } from './get-month-transactions'

const ALL_SQL = `
  SELECT t.id, t.amount, t.type, t.date, t.description, c.name AS categoryName
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  ORDER BY t.date DESC, t.created_at DESC, t.id DESC
`

export async function getAllTransactions(): Promise<TransactionListItem[]> {
  const rows = await window.dbAPI.query<TransactionRow>(ALL_SQL)
  return rows.map(mapTransactionRow)
}
