import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@renderer/entities/chat/model/types'
import { cn } from '@renderer/lib/cn'

interface ChatMessageListProps {
  messages: ChatMessage[]
  processing: boolean
}

export const ChatMessageList = ({ messages, processing }: ChatMessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, processing])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-zinc-300">Ask your AI CFO</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Questions about spending, runway, and anomalies stay on your device.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cn(
              'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'rounded-br-md bg-indigo-600 text-white'
                : 'rounded-bl-md bg-zinc-800 text-zinc-100'
            )}
          >
            {msg.content || (processing ? '…' : '')}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
