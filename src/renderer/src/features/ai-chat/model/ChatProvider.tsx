import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  chatDisplayTitle,
  mapChatRow,
  mapMessageRow,
  type Chat,
  type ChatMessage
} from '@renderer/entities/chat/model/types'
import { useLocalStorage } from '@renderer/hooks/use-local-storage'
import { mockInfer } from './mock-infer'

interface ChatContextValue {
  chats: Chat[]
  activeChatId: number | null
  messages: ChatMessage[]
  drawerOpen: boolean
  processing: boolean
  loading: boolean
  activeChatTitle: string
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  selectChat: (chatId: number) => Promise<void>
  createChat: () => Promise<number>
  deleteChat: (chatId: number) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  refreshChats: () => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export const useChat = (): ChatContextValue => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}

const LAST_CHAT_KEY = 'fidiom:lastActiveChatId'

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useLocalStorage<number | null>(LAST_CHAT_KEY, null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const inferRef = useRef(false)

  const refreshChats = async (): Promise<void> => {
    const rows = await window.chatAPI.list()
    setChats(rows.map(mapChatRow))
  }

  const loadChat = async (chatId: number): Promise<void> => {
    const chat = await window.chatAPI.get(chatId)
    if (!chat) {
      setActiveChatId(null)
      setMessages([])
      return
    }
    setActiveChatId(chatId)
    setMessages(chat.messages.map(mapMessageRow))
  }

  const ensureActiveChat = async (): Promise<number> => {
    if (activeChatId) {
      const existing = await window.chatAPI.get(activeChatId)
      if (existing) return activeChatId
    }

    const rows = await window.chatAPI.list()
    if (rows.length > 0) {
      const latest = mapChatRow(rows[0])
      await loadChat(latest.id)
      return latest.id
    }

    const created = await window.chatAPI.create()
    const chat = mapChatRow(created)
    setChats((prev) => [chat, ...prev])
    setActiveChatId(chat.id)
    setMessages([])
    return chat.id
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refreshChats()
        if (cancelled) return
        if (activeChatId) await loadChat(activeChatId)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openDrawer = (): void => {
    setDrawerOpen(true)
    void ensureActiveChat()
  }

  const closeDrawer = (): void => setDrawerOpen(false)

  const toggleDrawer = (): void => {
    setDrawerOpen((open) => {
      if (!open) void ensureActiveChat()
      return !open
    })
  }

  const selectChat = async (chatId: number): Promise<void> => {
    await loadChat(chatId)
  }

  const createChat = async (): Promise<number> => {
    const created = await window.chatAPI.create()
    const chat = mapChatRow(created)
    setChats((prev) => [chat, ...prev])
    setActiveChatId(chat.id)
    setMessages([])
    return chat.id
  }

  const deleteChat = async (chatId: number): Promise<void> => {
    await window.chatAPI.delete(chatId)
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setMessages([])
      await ensureActiveChat()
    }
    await refreshChats()
  }

  const sendMessage = async (text: string): Promise<void> => {
    const trimmed = text.trim()
    if (!trimmed || processing || inferRef.current) return

    const chatId = await ensureActiveChat()
    const userRow = await window.chatAPI.appendMessage(chatId, 'user', trimmed)
    const userMessage = mapMessageRow(userRow)
    setMessages((prev) => [...prev, userMessage])

    const assistantPlaceholder: ChatMessage = {
      id: -Date.now(),
      chatId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    }
    setMessages((prev) => [...prev, assistantPlaceholder])
    setProcessing(true)
    inferRef.current = true

    try {
      const full = await mockInfer(trimmed, (token) => {
        if (token === '') return
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + token }
          }
          return updated
        })
      })

      const assistantRow = await window.chatAPI.appendMessage(chatId, 'assistant', full)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = mapMessageRow(assistantRow)
        return updated
      })

      const current = await window.chatAPI.get(chatId)
      if (current && current.title_status === 'pending') {
        const titled = await window.chatAPI.generateTitle(chatId)
        const mapped = mapChatRow(titled)
        setChats((prev) => prev.map((c) => (c.id === chatId ? mapped : c)))
      } else {
        await refreshChats()
      }
    } finally {
      setProcessing(false)
      inferRef.current = false
    }
  }

  const activeChat = chats.find((c) => c.id === activeChatId)
  const activeChatTitle = activeChat ? chatDisplayTitle(activeChat) : 'New chat'

  const value: ChatContextValue = {
    chats,
    activeChatId,
    messages,
    drawerOpen,
    processing,
    loading,
    activeChatTitle,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    selectChat,
    createChat,
    deleteChat,
    sendMessage,
    refreshChats
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
