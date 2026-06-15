import { useState } from 'react'
import {
  getAllTransactions,
  getMonthTransactions,
  type TransactionListItem
} from '@renderer/entities/transaction'
import { exportTransactions } from '../api/export-transactions'

export interface ExportFeedback {
  type: 'success' | 'error'
  message: string
}

export interface UseExportTransactions {
  pending: boolean
  feedback: ExportFeedback | null
  dismissFeedback: () => void
  exportMonth: (month: number, year: number) => Promise<void>
  exportAll: () => Promise<void>
  exportSelected: (items: TransactionListItem[]) => Promise<void>
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

export const useExportTransactions = (): UseExportTransactions => {
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null)

  const run = async (
    load: () => Promise<TransactionListItem[]>,
    defaultName: string
  ): Promise<void> => {
    setPending(true)
    setFeedback(null)
    try {
      const items = await load()
      const result = await exportTransactions(items, defaultName)
      if (result.saved) {
        const where = result.filePath ? ` to ${fileName(result.filePath)}` : ''
        setFeedback({ type: 'success', message: `Exported ${items.length} transactions${where}` })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Export failed. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  const exportMonth = (month: number, year: number): Promise<void> =>
    run(
      () => getMonthTransactions(month, year),
      `transactions-${year}-${String(month).padStart(2, '0')}.csv`
    )

  const exportAll = (): Promise<void> => run(getAllTransactions, 'transactions-all.csv')

  const exportSelected = (items: TransactionListItem[]): Promise<void> =>
    run(() => Promise.resolve(items), 'transactions-selected.csv')

  return {
    pending,
    feedback,
    dismissFeedback: () => setFeedback(null),
    exportMonth,
    exportAll,
    exportSelected
  }
}
