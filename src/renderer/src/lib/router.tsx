import { createHashRouter } from 'react-router-dom'
import { ProtectedLayout } from '@renderer/components/layout/ProtectedLayout'
import { ProtectedRoute } from '@renderer/features/auth/ProtectedRoute'
import { AuthPage } from '@renderer/pages/auth'
import { ChatsPage } from '@renderer/pages/chats'
import { ResetPage } from '@renderer/pages/reset'
import { MainPage } from '@renderer/pages/main'

export const router = createHashRouter([
  { path: '/auth', element: <AuthPage /> },
  { path: '/reset', element: <ResetPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          { path: '/', element: <MainPage />, handle: { title: 'Dashboard' } },
          {
            path: '/chats',
            element: <ChatsPage />,
            handle: { title: 'AI Chats' }
          },
          {
            path: '/chats/:chatId',
            element: <ChatsPage />,
            handle: { title: 'AI Chats' }
          }
        ]
      }
    ]
  }
])
