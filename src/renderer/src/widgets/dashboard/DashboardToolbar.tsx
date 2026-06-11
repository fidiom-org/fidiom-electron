import { MonthPicker } from '@renderer/features/dashboard-period/ui/MonthPicker'
import { FinanceModeToggle } from '@renderer/features/finance-mode/ui/FinanceModeToggle'

import type { FinanceMode } from '@renderer/entities/dashboard/model/types'

interface DashboardToolbarProps {
  month: number
  year: number
  mode: FinanceMode
  onMonthChange: (value: string) => void
  onModeChange: (mode: FinanceMode) => void
}

export const DashboardToolbar = ({
  month,
  year,
  mode,
  onMonthChange,
  onModeChange
}: DashboardToolbarProps) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
        <MonthPicker month={month} year={year} onChange={onMonthChange} />
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Mode
          </span>
          <FinanceModeToggle mode={mode} onChange={onModeChange} />
        </div>
      </div>
    </div>
  )
}
