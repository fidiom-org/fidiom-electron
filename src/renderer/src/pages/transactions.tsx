import { Button } from '@renderer/components/ui/Button'
import { useCreateTransactionModal } from '@renderer/features/create-transaction'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { MonthPicker } from '@renderer/features/dashboard-period/ui/MonthPicker'
import {
  ExportMenu,
  ExportSelectionBar,
  ExportToast,
  useExportTransactions,
  useTransactionSelection
} from '@renderer/features/export-transactions'
import { TransactionListWidget } from '@renderer/widgets/transactions/TransactionListWidget'

export const TransactionsPage = () => {
  const period = useDashboardPeriod()
  const { open } = useCreateTransactionModal()
  const selection = useTransactionSelection()
  const exporter = useExportTransactions()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <MonthPicker month={period.month} year={period.year} onChange={period.setFromInput} />
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            month={period.month}
            year={period.year}
            onSelectTransactions={selection.enable}
            exporter={exporter}
          />
          <Button onClick={open}>New transaction</Button>
        </div>
      </div>
      {selection.selectionMode && (
        <ExportSelectionBar
          selectedItems={selection.selectedItems}
          onCancel={selection.cancel}
          exporter={exporter}
        />
      )}
      <TransactionListWidget month={period.month} year={period.year} selection={selection} />
      <ExportToast feedback={exporter.feedback} onDismiss={exporter.dismissFeedback} />
    </div>
  )
}
