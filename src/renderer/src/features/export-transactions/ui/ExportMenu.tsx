import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@renderer/components/ui/Button'
import { useClickOutside } from '@renderer/shared/lib/use-click-outside'
import type { UseExportTransactions } from '../model/use-export-transactions'

interface ExportMenuProps {
  month: number
  year: number
  onSelectTransactions: () => void
  exporter: UseExportTransactions
}

export const ExportMenu = ({ month, year, onSelectTransactions, exporter }: ExportMenuProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pending, exportMonth, exportAll } = exporter

  useClickOutside(ref, () => setOpen(false), open)

  const handleMonth = (): void => {
    setOpen(false)
    void exportMonth(month, year)
  }

  const handleAll = (): void => {
    setOpen(false)
    void exportAll()
  }

  const handleSelect = (): void => {
    setOpen(false)
    onSelectTransactions()
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
          <MenuItem label="Current month" onClick={handleMonth} />
          <MenuItem label="All transactions" onClick={handleAll} />
          <MenuItem label="Select transactions…" onClick={handleSelect} />
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  label: string
  onClick: () => void
}

const MenuItem = ({ label, onClick }: MenuItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
    >
      {label}
    </button>
  )
}
