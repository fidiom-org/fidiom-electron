import { useEffect, useRef, useState } from 'react'
import { CategoryPill, type CategoryOption } from '@renderer/entities/transaction'
import { useCategories } from '@renderer/features/settings'
import { useClickOutside } from '@renderer/shared/lib/use-click-outside'
import { cn } from '@renderer/lib/cn'

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
}

interface CategoryDropdownProps {
  search: string
  onSearchChange: (value: string) => void
  options: readonly CategoryOption[]
  value: string
  onSelect: (value: string) => void
}

const CategoryDropdown = ({ search, onSearchChange, options, value, onSelect }: CategoryDropdownProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl">
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          🔍
        </span>
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="w-full rounded-xl bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto">
        {options.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-500">No categories found</p>
        ) : (
          options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                'flex w-full rounded-lg px-1 py-1 text-left transition-colors hover:bg-zinc-800',
                option.value === value && 'bg-zinc-800'
              )}
            >
              <CategoryPill category={option} />
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export const CategorySelect = ({ value, onChange }: CategorySelectProps) => {
  const { categories } = useCategories()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const close = (): void => {
    setOpen(false)
    setSearch('')
  }

  useClickOutside(rootRef, close, open)

  const selected = categories.find((c) => c.value === value)
  const filtered = categories.filter((c) =>
    c.label.toLowerCase().includes(search.trim().toLowerCase())
  )

  const select = (next: string): void => {
    onChange(next)
    close()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        {selected ? (
          <CategoryPill category={selected} />
        ) : (
          <span className="text-zinc-500">Select a category</span>
        )}
        <span className={cn('text-zinc-500 transition-transform', open && 'rotate-180')}>▾</span>
      </button>

      {open && (
        <CategoryDropdown
          search={search}
          onSearchChange={setSearch}
          options={filtered}
          value={value}
          onSelect={select}
        />
      )}
    </div>
  )
}
