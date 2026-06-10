import { Outlet } from 'react-router-dom'
import { AppShell } from '@renderer/components/layout/AppShell'
import { ChatDrawer } from '@renderer/widgets/chat/ChatDrawer'
import { ChatFab } from '@renderer/widgets/chat/ChatFab'

export const ProtectedLayout = () => {
  return (
    <AppShell>
      <Outlet />
      <ChatFab />
      <ChatDrawer />
    </AppShell>
  )
}
