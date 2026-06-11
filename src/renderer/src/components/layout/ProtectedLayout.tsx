import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '@renderer/components/layout/AppShell'
import { ChatDrawer } from '@renderer/widgets/chat/ChatDrawer'
import { ChatFab } from '@renderer/widgets/chat/ChatFab'

export const ProtectedLayout = () => {
  const { pathname } = useLocation()
  const isChatsPage = pathname.startsWith('/chats')

  return (
    <AppShell>
      <Outlet />
      {isChatsPage ? null : (
        <>
          <ChatFab />
          <ChatDrawer />
        </>
      )}
    </AppShell>
  )
}
