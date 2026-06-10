import type { HTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur',
        className
      )}
      {...props}
    />
  )
}
