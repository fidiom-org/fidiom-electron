import {
  CATEGORY_COLORS,
  CATEGORY_SWATCH,
  type CategoryColor,
  type CategoryOption
} from '@renderer/entities/transaction'
import { Button } from '@renderer/components/ui/Button'
import { cn } from '@renderer/lib/cn'
import { useCategories } from '../model/use-categories'
import { SettingsSection } from './SettingsSection'

const ColorPicker = ({
  value,
  onChange
}: {
  value: CategoryColor
  onChange: (color: CategoryColor) => void
}) => (
  <div className="flex items-center gap-1.5">
    {CATEGORY_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        title={color}
        onClick={() => onChange(color)}
        className={cn(
          'h-5 w-5 rounded-full transition-transform',
          CATEGORY_SWATCH[color],
          value === color ? 'ring-2 ring-zinc-100 ring-offset-2 ring-offset-zinc-900' : 'opacity-60 hover:opacity-100'
        )}
      />
    ))}
  </div>
)

const CategoryRow = ({
  category,
  onChange,
  onRemove
}: {
  category: CategoryOption
  onChange: (patch: Partial<CategoryOption>) => void
  onRemove: () => void
}) => (
  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
    <input
      value={category.icon}
      onChange={(e) => onChange({ icon: e.target.value })}
      maxLength={2}
      aria-label="Icon"
      className="h-11 w-12 shrink-0 rounded-xl bg-zinc-800 text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500/50"
    />
    <input
      value={category.label}
      onChange={(e) => onChange({ label: e.target.value })}
      placeholder="Category name"
      aria-label="Category name"
      className="h-11 min-w-40 flex-1 rounded-xl bg-zinc-800 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
    />
    <ColorPicker value={category.color} onChange={(color) => onChange({ color })} />
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove category"
      className="ml-auto rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-rose-300"
    >
      ✕
    </button>
  </div>
)

export const CategorySettings = () => {
  const { categories, loading, save } = useCategories()

  const update = (value: string, patch: Partial<CategoryOption>): void => {
    void save(categories.map((c) => (c.value === value ? { ...c, ...patch } : c)))
  }

  const remove = (value: string): void => {
    void save(categories.filter((c) => c.value !== value))
  }

  const add = (): void => {
    void save([
      ...categories,
      { value: `cat-${Date.now()}`, label: '', color: 'zinc', icon: '🏷️' }
    ])
  }

  return (
    <SettingsSection
      title="Transaction categories"
      description="Customise the categories you can pick when recording a transaction."
    >
      <div className="space-y-2">
        {categories.map((category) => (
          <CategoryRow
            key={category.value}
            category={category}
            onChange={(patch) => update(category.value, patch)}
            onRemove={() => remove(category.value)}
          />
        ))}
      </div>
      <Button variant="outline" onClick={add} disabled={loading}>
        + Add category
      </Button>
    </SettingsSection>
  )
}
