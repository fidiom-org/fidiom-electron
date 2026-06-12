import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { cn } from '@renderer/lib/cn'
import { useVoiceRecorder } from '@renderer/hooks/use-voice-recorder'

interface ChatComposerProps {
  disabled?: boolean
  onSend: (text: string) => Promise<void>
}

export const ChatComposer = ({ disabled, onSend }: ChatComposerProps) => {
  const [input, setInput] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const recorder = useVoiceRecorder()

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

  const toggleMic = async (): Promise<void> => {
    if (recorder.recording) {
      const pcm = await recorder.stop()
      if (!pcm) return
      setTranscribing(true)
      try {
        const text = await window.speechAPI.transcribe(pcm)
        if (text) setInput((prev) => (prev ? `${prev} ${text}` : text))
      } catch {
        // transcription failed — leave the input as-is
      } finally {
        setTranscribing(false)
      }
    } else {
      try {
        await recorder.start()
      } catch {
        // mic permission denied or unavailable
      }
    }
  }

  const micBusy = disabled || transcribing
  const placeholder = recorder.recording
    ? 'Listening… tap the mic to stop'
    : transcribing
      ? 'Transcribing…'
      : 'Ask about your finances…'

  return (
    <form onSubmit={onSubmit} className="border-t border-zinc-800 p-4">
      <div className="flex gap-3">
        <textarea
          className="flex-1 resize-none rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          rows={2}
          placeholder={placeholder}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex flex-col justify-end gap-2">
          <button
            type="button"
            onClick={() => void toggleMic()}
            disabled={micBusy}
            aria-label={recorder.recording ? 'Stop recording' : 'Record voice question'}
            title="Ask by voice"
            className={cn(
              'grid h-10 w-10 place-items-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              recorder.recording
                ? 'animate-pulse bg-rose-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
          >
            {transcribing ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            ) : (
              <MicIcon />
            )}
          </button>
          <Button type="submit" disabled={disabled || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </form>
  )
}

const MicIcon = (): React.JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)
