import { useState } from 'react'
import { Button } from '@renderer/components/ui/Button'

interface CopyFieldProps {
  label: string
  value: string
  mono?: boolean
}

export const CopyField = ({ label, value, mono = true }: CopyFieldProps): React.ReactElement => {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code
          className={`flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-300 ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </code>
        <Button
          variant="outline"
          className="px-3 py-1.5 text-xs"
          onClick={() => {
            void navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
