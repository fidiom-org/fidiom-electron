import { useDashboardData } from '@renderer/entities/dashboard/model/useDashboardData'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { useFinanceMode } from '@renderer/features/finance-mode/model/useFinanceMode'
import { useProjects } from '@renderer/entities/project'
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
  const projects = useProjects()
  const { data, loading } = useDashboardData(period, mode)
  const scopedProjects = projects.filter((project) => project.type === mode)
  const isEmpty =
    scopedProjects.length === 0 ||
    (data?.summary.netWorth === 0 &&
      data.expensesByCategory.length === 0 &&
      data.expensesOverTime.every((point) => point.amount === 0))

  return (
    <div className="space-y-6">
      {loading || !data ? (
        <p className="text-sm text-zinc-500">Loading dashboard…</p>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-sm text-zinc-400">No financial data yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Create a project and add payments to populate this dashboard.
          </p>
        </div>
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
