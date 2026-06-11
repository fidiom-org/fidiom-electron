import type { PlanPeriodGranularity } from '@renderer/entities/project'
import { formatPlanPeriodLabel, type PlanPeriod } from '@renderer/entities/project'
import { cn } from '@renderer/lib/cn'

interface PlanPeriodPickerProps {
  period: PlanPeriod
  onGranularityChange: (granularity: PlanPeriodGranularity) => void
  onMonthChange: (value: string) => void
}

const granularities: Array<{ value: PlanPeriodGranularity; label: string }> = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' }
]

export const PlanPeriodPicker = ({
  period,
  onGranularityChange,
  onMonthChange
}: PlanPeriodPickerProps) => {
  const monthValue = `${period.year}-${String(period.month).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Period type
        </span>
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          {granularities.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onGranularityChange(item.value)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm transition-colors',
                period.granularity === item.value
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block min-w-44">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          {period.granularity === 'quarter' ? 'Quarter' : 'Month'}
        </span>
        <input
          type="month"
          value={monthValue}
          onChange={(event) => onMonthChange(event.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <p className="pb-2.5 text-sm text-zinc-500">{formatPlanPeriodLabel(period)}</p>
    </div>
  )
}
