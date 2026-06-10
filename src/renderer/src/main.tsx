import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@renderer/features/auth/AuthContext'
import { ChatProvider } from '@renderer/features/ai-chat'
import { CreateTransactionModalProvider } from '@renderer/features/create-transaction'
import { router } from '@renderer/lib/router'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CreateTransactionModalProvider>
        <ChatProvider>
          <RouterProvider router={router} />
        </ChatProvider>
      </CreateTransactionModalProvider>
    </AuthProvider>
  </StrictMode>
)
