import { useChat } from '@renderer/features/ai-chat'
import { cn } from '@renderer/lib/cn'

export const ChatFab = () => {
  const { toggleDrawer, drawerOpen, processing } = useChat()

  return (
    <button
      type="button"
      aria-label="Open AI chat"
      aria-expanded={drawerOpen}
      onClick={toggleDrawer}
      className={cn(
        'fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-950/40 transition-transform hover:scale-105 hover:bg-indigo-500',
        processing && 'animate-pulse'
      )}
    >
      ✦
    </button>
  )
}
