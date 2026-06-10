import type { TopCategory } from '@renderer/entities/dashboard/model/types'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { formatCurrency } from '@renderer/shared/lib/format'

interface TopCategoriesWidgetProps {
  categories: TopCategory[]
}

export const TopCategoriesWidget = ({ categories }: TopCategoriesWidgetProps) => {
  return (
    <ChartCard title="Top spending categories">
      <ul className="space-y-3">
        {categories.map((category, i) => (
          <li key={category.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-zinc-300">
                {i + 1}. {category.name}
              </span>
              <span className="font-medium">{formatCurrency(category.amount)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${category.sharePercent}%` }}
              />
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{category.sharePercent}% of total</p>
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}
