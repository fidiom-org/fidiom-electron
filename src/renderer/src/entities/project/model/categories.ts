export const EXPENSE_CATEGORIES = [
  'SaaS',
  'Infrastructure',
  'Legal',
  'Marketing',
  'Payroll',
  'Office',
  'Other'
] as const

export const INCOME_CATEGORIES = ['Subscriptions', 'Services', 'Investment', 'Other'] as const

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' }
] as const

export const getCategoriesForDirection = (direction: 'expense' | 'income'): readonly string[] =>
  direction === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
