import { createHashRouter } from 'react-router-dom'
import { ProtectedRoute } from '@renderer/features/auth/ProtectedRoute'
import { AuthPage } from '@renderer/pages/auth'
import { ResetPage } from '@renderer/pages/reset'
import { MainPage } from '@renderer/pages/main'

export const router = createHashRouter([
  { path: '/auth', element: <AuthPage /> },
  { path: '/reset', element: <ResetPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <MainPage /> }]
  }
])
