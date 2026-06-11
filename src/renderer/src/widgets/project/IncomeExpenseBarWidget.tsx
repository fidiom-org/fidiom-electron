import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { MonthlyTotals, ProjectCurrency } from '@renderer/entities/project'
import { ChartCard } from '@renderer/shared/ui/ChartCard'
import { formatCurrency } from '@renderer/shared/lib/format'

interface IncomeExpenseBarWidgetProps {
  points: MonthlyTotals[]
  currency: ProjectCurrency
}

export const IncomeExpenseBarWidget = ({ points, currency }: IncomeExpenseBarWidgetProps) => {
  return (
    <ChartCard title="Income vs expenses">
      <div className="h-48 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 12,
                color: '#fafafa'
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
            <Bar dataKey="expenses" name="Expenses" fill="#f472b6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
