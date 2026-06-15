import { SettingsSection } from './SettingsSection'

const POINTS = [
  'All data stays on this device in an encrypted vault.',
  'AI runs locally — your prompts and receipts are never uploaded.',
  'Models download once, then work fully offline.'
]

export const AboutSettings = () => (
  <SettingsSection title="Privacy & storage" description="How Fibiom handles your data.">
    <ul className="space-y-2 text-sm text-zinc-400">
      {POINTS.map((point) => (
        <li key={point} className="flex gap-2">
          <span className="text-emerald-400">•</span>
          {point}
        </li>
      ))}
    </ul>
  </SettingsSection>
)
