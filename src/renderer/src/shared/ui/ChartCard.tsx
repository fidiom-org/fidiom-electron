import type { ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

interface ChartCardProps {
  title: string
  className?: string
  children: ReactNode
}

export const ChartCard = ({ title, className, children }: ChartCardProps): React.JSX.Element => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur',
        className
      )}
    >
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      {children}
    </div>
  )
}
