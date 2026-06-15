import type { TransactionListItem } from '@renderer/entities/transaction'
import { Button } from '@renderer/components/ui/Button'
import type { UseExportTransactions } from '../model/use-export-transactions'

interface ExportSelectionBarProps {
  selectedItems: TransactionListItem[]
  onCancel: () => void
  exporter: UseExportTransactions
}

export const ExportSelectionBar = ({
  selectedItems,
  onCancel,
  exporter
}: ExportSelectionBarProps) => {
  const { pending, exportSelected } = exporter
  const count = selectedItems.length

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
      <span className="text-sm text-zinc-400">{count} selected</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="outline"
          disabled={pending || count === 0}
          onClick={() => void exportSelected(selectedItems)}
        >
          Export selected ({count})
        </Button>
      </div>
    </div>
  )
}
