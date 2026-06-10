import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { DistributionSlice } from '@renderer/entities/dashboard/model/types'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { CHART_COLORS } from '@renderer/shared/config/charts'
import { formatCurrency } from '@renderer/shared/lib/format'

interface DistributionWidgetProps {
  title: string
  slices: DistributionSlice[]
}

export const DistributionWidget = ({ title, slices }: DistributionWidgetProps) => {
  return (
    <ChartCard title={title}>
      <div className="h-48 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="45%"
              outerRadius="70%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 12,
                color: '#fafafa'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-zinc-400">
        {slices.map((slice, i) => (
          <li key={slice.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {slice.name}
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}
