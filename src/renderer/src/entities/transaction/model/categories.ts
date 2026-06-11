export type CategoryColor =
  | 'amber'
  | 'sky'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'indigo'
  | 'teal'
  | 'zinc'

export interface CategoryOption {
  value: string
  label: string
  color: CategoryColor
  icon: string
}

export const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'food', label: 'Food', color: 'amber', icon: '🍔' },
  { value: 'transport', label: 'Transport', color: 'sky', icon: '🚗' },
  { value: 'salary', label: 'Salary', color: 'emerald', icon: '💰' },
  { value: 'entertainment', label: 'Entertainment', color: 'violet', icon: '🎬' },
  { value: 'other', label: 'Other', color: 'zinc', icon: '📦' }
]

export const CATEGORY_COLORS: CategoryColor[] = [
  'amber',
  'sky',
  'emerald',
  'violet',
  'rose',
  'indigo',
  'teal',
  'zinc'
]

export const CATEGORY_PILL: Record<CategoryColor, string> = {
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  sky: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  indigo: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  teal: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
  zinc: 'border-zinc-600/60 bg-zinc-700/30 text-zinc-300'
}

export const CATEGORY_SWATCH: Record<CategoryColor, string> = {
  amber: 'bg-amber-400',
  sky: 'bg-sky-400',
  emerald: 'bg-emerald-400',
  violet: 'bg-violet-400',
  rose: 'bg-rose-400',
  indigo: 'bg-indigo-400',
  teal: 'bg-teal-400',
  zinc: 'bg-zinc-400'
}
