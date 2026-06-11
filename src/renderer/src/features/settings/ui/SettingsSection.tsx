import type { ReactNode } from 'react'
import { Card } from '@renderer/components/ui/Card'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <Card className="space-y-4">
    <div>
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
    {children}
  </Card>
)
