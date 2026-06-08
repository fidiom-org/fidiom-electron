export interface DashboardPeriod {
  month: number
  year: number
}

export interface DashboardSummary {
  activeModels: number
  inferences: number
  avgLatencyMs: number
  storageGb: number
}

export interface MonthlyOverview {
  usagePercent: number
  label: string
}

export interface MonthlyInferencePoint {
  period: string
  count: number
}

export interface DistributionSlice {
  name: string
  value: number
}

export interface DashboardData {
  summary: DashboardSummary
  lastUpdated: string
  overview: MonthlyOverview
  monthlyInferences: MonthlyInferencePoint[]
  modelUsage: DistributionSlice[]
  storageBreakdown: DistributionSlice[]
  inferenceTypes: DistributionSlice[]
  resourceUsage: DistributionSlice[]
}
