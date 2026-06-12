import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@renderer/entities/chat/model/types'
import { cn } from '@renderer/lib/cn'
import { FormattedMessage } from './FormattedMessage'

interface ChatMessageListProps {
  messages: ChatMessage[]
  processing: boolean
}

const playWav = (bytes: Uint8Array): HTMLAudioElement => {
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.onended = (): void => URL.revokeObjectURL(url)
  void audio.play()
  return audio
}

export const ChatMessageList = ({ messages, processing }: ChatMessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [speakingId, setSpeakingId] = useState<number | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, processing])

  const speak = async (msg: ChatMessage): Promise<void> => {
    if (speakingId !== null) return
    setSpeakingId(msg.id)
    try {
      const bytes = await window.speechAPI.speak(msg.content)
      if (bytes.byteLength > 0) playWav(bytes)
    } catch {
      // synthesis failed — ignore
    } finally {
      setSpeakingId(null)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-zinc-300">Ask your AI CFO</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Type or use the mic — questions about spending, runway, and anomalies stay on your device.
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
              'group max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'rounded-br-md bg-indigo-600 text-white'
                : 'rounded-bl-md bg-zinc-800 text-zinc-100'
            )}
          >
            {msg.content ? (
              msg.role === 'assistant' ? (
                <div>
                  <FormattedMessage content={msg.content} />
                  <button
                    type="button"
                    onClick={() => void speak(msg)}
                    disabled={speakingId !== null}
                    aria-label="Read answer aloud"
                    title="Read aloud"
                    className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
                  >
                    {speakingId === msg.id ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    ) : (
                      <SpeakerIcon />
                    )}
                    {speakingId === msg.id ? 'Speaking…' : 'Listen'}
                  </button>
                </div>
              ) : (
                msg.content
              )
            ) : processing ? (
              '…'
            ) : (
              ''
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

const SpeakerIcon = (): React.JSX.Element => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
)
