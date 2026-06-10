import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@renderer/components/ui/Button'

interface ChatComposerProps {
  disabled?: boolean
  onSend: (text: string) => Promise<void>
}

export const ChatComposer = ({ disabled, onSend }: ChatComposerProps) => {
  const [input, setInput] = useState('')

  const submit = async (): Promise<void> => {
    const text = input.trim()
    if (!text || disabled) return
    setInput('')
    await onSend(text)
  }

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault()
    void submit()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-zinc-800 p-4">
      <div className="flex gap-3">
        <textarea
          className="flex-1 resize-none rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          rows={2}
          placeholder="Ask about your finances…"
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" disabled={disabled || !input.trim()} className="self-end">
          Send
        </Button>
      </div>
    </form>
  )
}
