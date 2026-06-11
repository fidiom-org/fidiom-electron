import { CURRENCY_OPTIONS } from '@renderer/entities/project'
import { Select } from '@renderer/shared/ui/Select'
import { SETTING_KEYS } from '../model/keys'
import { useSetting } from '../model/use-setting'
import { SettingsSection } from './SettingsSection'

export const CurrencySettings = () => {
  const { value, loading, update } = useSetting(SETTING_KEYS.defaultCurrency, 'USD')

  return (
    <SettingsSection
      title="Default currency"
      description="Pre-selected when you create a new project."
    >
      <div className="max-w-xs">
        <Select
          value={value}
          disabled={loading}
          onChange={(event) => void update(event.target.value)}
          options={CURRENCY_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label
          }))}
        />
      </div>
    </SettingsSection>
  )
}
