import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '@renderer/features/ai-chat'
import { Button } from '@renderer/components/ui/Button'
import { ChatComposer } from './ChatComposer'
import { ChatMessageList } from './ChatMessageList'

export const ChatDrawer = () => {
  const navigate = useNavigate()
  const {
    drawerOpen,
    closeDrawer,
    messages,
    processing,
    loading,
    activeChatTitle,
    createChat,
    sendMessage
  } = useChat()

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeDrawer, drawerOpen])

  if (!drawerOpen) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close chat"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={closeDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AI chat"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <header className="flex items-center gap-2 border-b border-zinc-800 px-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">{activeChatTitle}</p>
            <p className="text-xs text-zinc-500">On-device AI CFO</p>
          </div>
          <Button variant="ghost" onClick={() => void createChat().then(() => undefined)}>
            New chat
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              closeDrawer()
              navigate('/chats')
            }}
          >
            History
          </Button>
          <button
            type="button"
            aria-label="Close"
            onClick={closeDrawer}
            className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            ✕
          </button>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading chat…
          </div>
        ) : (
          <>
            <ChatMessageList messages={messages} processing={processing} />
            <ChatComposer disabled={processing} onSend={sendMessage} />
          </>
        )}
      </aside>
    </>
  )
}
