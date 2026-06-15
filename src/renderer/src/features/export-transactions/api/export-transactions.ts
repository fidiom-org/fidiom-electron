import type { TransactionListItem } from '@renderer/entities/transaction'
import { toCsv } from '../lib/to-csv'

export async function exportTransactions(
  items: TransactionListItem[],
  defaultName: string
): Promise<{ saved: boolean; filePath?: string }> {
  return window.exportAPI.saveCsv(defaultName, toCsv(items))
}
