import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { ExpensePoint } from '@renderer/entities/dashboard/model/types'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { CHART_COLORS } from '@renderer/shared/config/charts'
import { formatCurrency } from '@renderer/shared/lib/format'

interface ExpensesOverTimeWidgetProps {
  points: ExpensePoint[]
}

export const ExpensesOverTimeWidget = ({ points }: ExpensesOverTimeWidgetProps) => {
  return (
    <ChartCard title="Expenses over time">
      <div className="h-48 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 12,
                color: '#fafafa'
              }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {points.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
