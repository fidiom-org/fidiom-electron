export function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

export function formatLatency(ms: number): string {
  return `${ms}ms`
}

export function formatStorage(gb: number): string {
  return `${gb.toFixed(1)} GB`
}

export function formatDate(iso: string): string {
  return iso
}
