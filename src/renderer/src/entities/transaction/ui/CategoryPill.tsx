import { cn } from '@renderer/lib/cn'
import { CATEGORY_PILL, type CategoryOption } from '../model/categories'

interface CategoryPillProps {
  category: CategoryOption | null
  size?: 'sm' | 'md'
  className?: string
}

const SIZES = {
  sm: 'gap-1 px-2 py-0.5 text-xs',
  md: 'gap-2 px-3 py-1.5 text-sm font-medium'
}

export const CategoryPill = ({ category, size = 'md', className }: CategoryPillProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border',
        SIZES[size],
        CATEGORY_PILL[category?.color ?? 'zinc'],
        className
      )}
    >
      <span aria-hidden>{category?.icon ?? '📦'}</span>
      {category?.label ?? 'Uncategorized'}
    </span>
  )
}
