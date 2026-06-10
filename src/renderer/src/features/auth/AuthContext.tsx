import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface AuthState {
  initialized: boolean
  unlocked: boolean
}

interface AuthContextValue extends AuthState {
  loading: boolean
  setup: (masterKey: string) => Promise<void>
  unlock: (masterKey: string) => Promise<boolean>
  lock: () => Promise<void>
  reset: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    initialized: false,
    unlocked: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.authAPI
      .status()
      .then(setState)
      .finally(() => setLoading(false))
  }, [])

  const value: AuthContextValue = {
    ...state,
    loading,
    setup: async (masterKey) => {
      await window.authAPI.setup(masterKey)
      setState({ initialized: true, unlocked: true })
    },
    unlock: async (masterKey) => {
      const ok = await window.authAPI.unlock(masterKey)
      if (ok) setState({ initialized: true, unlocked: true })
      return ok
    },
    lock: async () => {
      await window.authAPI.lock()
      setState((s) => ({ ...s, unlocked: false }))
    },
    reset: async () => {
      await window.authAPI.reset()
      setState({ initialized: false, unlocked: false })
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
