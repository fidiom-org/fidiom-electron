import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'
import { cn } from '@renderer/lib/cn'

interface Option {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  options: ReadonlyArray<Option>
  ref?: Ref<HTMLSelectElement>
}

export const Select = ({ label, options, className, id, ref, ...props }: SelectProps) => {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-zinc-400">{label}</span>}
      <select
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-xl bg-zinc-800 pl-3 pr-5 py-3 text-sm text-zinc-100 outline-none',
          'focus:ring-2 focus:ring-indigo-500/50',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
