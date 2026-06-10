import { useDashboardData } from '@renderer/entities/dashboard/model/useDashboardData'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { useFinanceMode } from '@renderer/features/finance-mode/model/useFinanceMode'
import { AnomaliesWidget } from '@renderer/widgets/dashboard/AnomaliesWidget'
import { DashboardSummaryBar } from '@renderer/widgets/dashboard/DashboardSummaryBar'
import { DashboardToolbar } from '@renderer/widgets/dashboard/DashboardToolbar'
import { DistributionWidget } from '@renderer/widgets/dashboard/DistributionWidget'
import { ExpensesOverTimeWidget } from '@renderer/widgets/dashboard/ExpensesOverTimeWidget'
import { PeriodComparisonWidget } from '@renderer/widgets/dashboard/PeriodComparisonWidget'
import { RunwayCalculatorWidget } from '@renderer/widgets/dashboard/RunwayCalculatorWidget'
import { TopCategoriesWidget } from '@renderer/widgets/dashboard/TopCategoriesWidget'

export const MainPage = () => {
  const period = useDashboardPeriod()
  const { mode, setMode, isBusiness } = useFinanceMode()
  const { data, loading } = useDashboardData(period, mode)

  return (
    <div className="space-y-6">
        {loading || !data ? (
          <p className="text-sm text-zinc-500">Loading dashboard…</p>
        ) : (
          <>
            <DashboardSummaryBar summary={data.summary} />
            <DashboardToolbar
              month={period.month}
              year={period.year}
              mode={mode}
              onMonthChange={period.setFromInput}
              onModeChange={setMode}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ExpensesOverTimeWidget points={data.expensesOverTime} />
              <DistributionWidget title="Expenses by category" slices={data.expensesByCategory} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PeriodComparisonWidget comparison={data.periodComparison} />
              <TopCategoriesWidget categories={data.topCategories} />
            </div>
            <div
              className={`grid grid-cols-1 gap-4 ${isBusiness ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
            >
              <AnomaliesWidget anomalies={data.anomalies} />
              {isBusiness && data.runway && <RunwayCalculatorWidget runway={data.runway} />}
            </div>
          </>
        )}
      </div>
  )
}
