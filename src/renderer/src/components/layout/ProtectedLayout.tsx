import { Outlet } from 'react-router-dom'
import { AppShell } from '@renderer/components/layout/AppShell'

export const ProtectedLayout = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
