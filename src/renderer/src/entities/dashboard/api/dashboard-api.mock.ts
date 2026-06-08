import type { DashboardApi } from './dashboard-api'
import type { DashboardData, DashboardPeriod } from '../model/types'

function periodSeed(period: DashboardPeriod): number {
  return period.year * 12 + period.month
}

function pseudo(seed: number, offset: number): number {
  return ((seed * 9301 + offset * 49297) % 233280) / 233280
}

function recentMonths(period: DashboardPeriod, count: number): DashboardPeriod[] {
  const months: DashboardPeriod[] = []
  for (let i = count - 1; i >= 0; i--) {
    let month = period.month - i
    let year = period.year
    while (month <= 0) {
      month += 12
      year -= 1
    }
    months.push({ month, year })
  }
  return months
}

function createMockDashboardData(period: DashboardPeriod): DashboardData {
  const seed = periodSeed(period)
  const scale = 0.75 + pseudo(seed, 1) * 0.5

  return {
    summary: {
      activeModels: 2 + (seed % 3),
      inferences: Math.round((6000 + seed * 211) * scale),
      avgLatencyMs: Math.round(110 + pseudo(seed, 2) * 90),
      storageGb: Math.round((1.6 + pseudo(seed, 3) * 1.4) * 10) / 10
    },
    lastUpdated: `${period.year}-${String(period.month).padStart(2, '0')}-07`,
    overview: {
      usagePercent: Math.round(35 + pseudo(seed, 4) * 55),
      label: 'Current'
    },
    monthlyInferences: recentMonths(period, 6).map((m, i) => ({
      period: `${m.month}/${m.year}`,
      count: Math.round((400 + seed * 17 + i * 320) * (0.85 + pseudo(seed, 10 + i) * 0.3))
    })),
    modelUsage: [
      { name: 'llama-3.2-1b', value: Math.round(40 + pseudo(seed, 20) * 30) },
      { name: 'phi-3-mini', value: Math.round(20 + pseudo(seed, 21) * 25) },
      { name: 'qwen2.5-0.5b', value: Math.round(10 + pseudo(seed, 22) * 20) }
    ],
    storageBreakdown: [
      { name: 'Encrypted DB', value: Math.round(30 + pseudo(seed, 30) * 15) },
      { name: 'Model weights', value: Math.round(40 + pseudo(seed, 31) * 20) },
      { name: 'Chat cache', value: Math.round(10 + pseudo(seed, 32) * 15) }
    ],
    inferenceTypes: [
      { name: 'Chat', value: Math.round(50 + pseudo(seed, 40) * 20) },
      { name: 'Completion', value: Math.round(20 + pseudo(seed, 41) * 15) },
      { name: 'Embedding', value: Math.round(10 + pseudo(seed, 42) * 10) }
    ],
    resourceUsage: [
      { name: 'On-device CPU', value: Math.round(45 + pseudo(seed, 50) * 20) },
      { name: 'On-device GPU', value: Math.round(25 + pseudo(seed, 51) * 20) },
      { name: 'Disk I/O', value: Math.round(10 + pseudo(seed, 52) * 15) }
    ]
  }
}

export const mockDashboardApi: DashboardApi = {
  getData: async (period) => createMockDashboardData(period)
}
