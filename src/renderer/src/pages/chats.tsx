import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { chatDisplayTitle } from '@renderer/entities/chat/model/types'
import { useChat } from '@renderer/features/ai-chat'
import { Button } from '@renderer/components/ui/Button'
import { cn } from '@renderer/lib/cn'
import { ChatComposer } from '@renderer/widgets/chat/ChatComposer'
import { ChatMessageList } from '@renderer/widgets/chat/ChatMessageList'

const formatChatDate = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const ChatsPage = () => {
  const navigate = useNavigate()
  const { chatId: chatIdParam } = useParams()
  const parsedChatId = chatIdParam ? Number(chatIdParam) : null

  const {
    chats,
    activeChatId,
    messages,
    processing,
    loading,
    activeChatTitle,
    selectChat,
    createChat,
    deleteChat,
    sendMessage
  } = useChat()

  useEffect(() => {
    if (parsedChatId && !Number.isNaN(parsedChatId)) {
      void selectChat(parsedChatId)
    }
  }, [parsedChatId, selectChat])

  const onSelectChat = (chatId: number): void => {
    navigate(`/chats/${chatId}`)
    void selectChat(chatId)
  }

  const onCreateChat = async (): Promise<void> => {
    const chatId = await createChat()
    navigate(`/chats/${chatId}`)
  }

  const onDeleteChat = async (): Promise<void> => {
    if (!activeChatId) return
    await deleteChat(activeChatId)
    navigate('/chats')
  }

  return (
    <div className="-m-8 flex h-[calc(100%+4rem)] min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 border-t border-zinc-800">
        <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
            <p className="text-sm font-medium text-zinc-300">Conversations</p>
            <Button variant="ghost" onClick={() => void onCreateChat()}>
              New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading && chats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-zinc-500">Loading…</p>
            ) : chats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-zinc-500">No conversations yet.</p>
            ) : (
              chats.map((chat) => {
                const selected = activeChatId === chat.id
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      'mb-1 w-full rounded-xl px-3 py-3 text-left transition-colors',
                      selected
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    )}
                  >
                    <p className="truncate text-sm font-medium">{chatDisplayTitle(chat)}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatChatDate(chat.updatedAt)}
                      {chat.titleStatus === 'pending' && messages.length > 0 ? ' · naming…' : ''}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-zinc-100">
                {activeChatId ? activeChatTitle : 'Select a conversation'}
              </h2>
              <p className="text-xs text-zinc-500">Local AI CFO assistant</p>
            </div>
            {activeChatId && (
              <Button variant="outline" onClick={() => void onDeleteChat()}>
                Delete
              </Button>
            )}
          </header>

          {!activeChatId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
              Pick a conversation or start a new one.
            </div>
          ) : (
            <>
              <ChatMessageList messages={messages} processing={processing} />
              <ChatComposer disabled={processing} onSend={sendMessage} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
