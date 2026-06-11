import { Button } from '@renderer/components/ui/Button'
import { useCreateTransactionModal } from '@renderer/features/create-transaction'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { MonthPicker } from '@renderer/features/dashboard-period/ui/MonthPicker'
import { TransactionListWidget } from '@renderer/widgets/transactions/TransactionListWidget'

export const TransactionsPage = () => {
  const period = useDashboardPeriod()
  const { open } = useCreateTransactionModal()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <MonthPicker month={period.month} year={period.year} onChange={period.setFromInput} />
        </div>
        <Button onClick={open}>New transaction</Button>
      </div>
      <TransactionListWidget month={period.month} year={period.year} />
    </div>
  )
}
