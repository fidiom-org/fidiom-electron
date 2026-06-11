import type { CategoryOption } from './categories'
import type { TransactionDraft } from './schema'

export type TransactionType = TransactionDraft['type']

export interface Transaction extends TransactionDraft {
  id: string
  createdAt: string
}

export interface TransactionListItem {
  id: number
  amount: number
  type: TransactionType
  category: CategoryOption | null
  date: string
  description: string | null
}

export interface MonthTransactionsResult {
  transactions: TransactionListItem[]
  loading: boolean
}
