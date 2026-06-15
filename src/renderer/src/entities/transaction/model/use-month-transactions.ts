import { useEffect, useState } from 'react'
import { getMonthTransactions } from '../api/get-month-transactions'
import { useTransactionsVersion } from './transactions-store'
import type { MonthTransactionsResult, TransactionListItem } from './types'

export function useMonthTransactions(month: number, year: number): MonthTransactionsResult {
  const version = useTransactionsVersion()
  const [transactions, setTransactions] = useState<TransactionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getMonthTransactions(month, year)
      .then((rows) => {
        if (!cancelled) setTransactions(rows)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [month, year, version])

  return { transactions, loading }
}
