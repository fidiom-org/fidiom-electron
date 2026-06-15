export const shortKey = (hex: string): string =>
  hex.length > 18 ? `${hex.slice(0, 8)}…${hex.slice(-8)}` : hex

export const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export const formatAgo = (ts: number, now: number = Date.now()): string => {
  const diff = now - ts
  if (diff < 2000) return 'just now'
  return `${formatDuration(diff)} ago`
}
