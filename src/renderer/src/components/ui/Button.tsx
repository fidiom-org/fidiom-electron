import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

type Variant = 'primary' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800',
  outline: 'border border-zinc-700 text-zinc-200 hover:bg-zinc-800'
}

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
