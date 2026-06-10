interface MonthPickerProps {
  month: number
  year: number
  onChange: (value: string) => void
}

export const MonthPicker = ({ month, year, onChange }: MonthPickerProps): React.JSX.Element => {
  const value = `${year}-${String(month).padStart(2, '0')}`

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Month
      </span>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-500"
      />
    </label>
  )
}
