import {
  AboutSettings,
  CategorySettings,
  CurrencySettings,
  ModelSettings
} from '@renderer/features/settings'

export const SettingsPage = () => (
  <div className="mx-auto max-w-3xl space-y-6">
    <ModelSettings />
    <CurrencySettings />
    <CategorySettings />
    <AboutSettings />
  </div>
)
