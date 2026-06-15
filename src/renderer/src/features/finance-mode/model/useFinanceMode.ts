import { useLocalStorage } from '@renderer/hooks/use-local-storage'
import type { FinanceMode } from '@renderer/entities/dashboard/model/types'

const STORAGE_KEY = 'fibiom:finance-mode'

export function useFinanceMode(): {
  mode: FinanceMode
  setMode: (mode: FinanceMode) => void
  isBusiness: boolean
} {
  const [mode, setMode] = useLocalStorage<FinanceMode>(STORAGE_KEY, 'personal')

  return { mode, setMode, isBusiness: mode === 'business' }
}
