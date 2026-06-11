import type { CategorySlice } from '@renderer/entities/project'
import { DistributionWidget } from '@renderer/widgets/dashboard/DistributionWidget'

interface ExpenseStructureWidgetProps {
  slices: CategorySlice[]
}

export const ExpenseStructureWidget = ({ slices }: ExpenseStructureWidgetProps) => {
  if (slices.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Expense structure
        </p>
        <p className="py-16 text-center text-sm text-zinc-500">No expenses this month</p>
      </div>
    )
  }

  return <DistributionWidget title="Expense structure" slices={slices} />
}
