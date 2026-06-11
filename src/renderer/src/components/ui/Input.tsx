import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@renderer/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  // React 19 treats ref as a regular prop; declaring it lets RHF's register()
  // (which spreads a ref) bind the native <input>.
  ref?: Ref<HTMLInputElement>
}

export const Input = ({ label, className, id, ref, ...props }: InputProps) => {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-zinc-400">{label}</span>}
      <input
        id={id}
        ref={ref}
        className={cn(
          'mt-1 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none',
          'placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50',
          className
        )}
        {...props}
      />
    </label>
  )
}
