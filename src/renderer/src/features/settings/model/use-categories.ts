import { useEffect, useState } from 'react'
import { DEFAULT_CATEGORY_OPTIONS, type CategoryOption } from '@renderer/entities/transaction'
import { SETTING_KEYS } from './keys'

/**
 * Transaction categories are persisted as a JSON array in the encrypted
 * settings table. When nothing is stored yet (or the value is corrupt) we fall
 * back to the built-in defaults so the rest of the app always has a list to use.
 */
const parse = (raw: string | null): CategoryOption[] => {
  if (!raw) return DEFAULT_CATEGORY_OPTIONS
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as CategoryOption[]) : DEFAULT_CATEGORY_OPTIONS
  } catch {
    return DEFAULT_CATEGORY_OPTIONS
  }
}

export const loadCategories = async (): Promise<CategoryOption[]> => {
  const raw = await window.settingsAPI.get(SETTING_KEYS.transactionCategories)
  return parse(raw)
}

export const useCategories = (): {
  categories: CategoryOption[]
  loading: boolean
  save: (next: CategoryOption[]) => Promise<void>
} => {
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    loadCategories()
      .then((stored) => {
        if (active) setCategories(stored)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const save = async (next: CategoryOption[]): Promise<void> => {
    setCategories(next)
    await window.settingsAPI.set(SETTING_KEYS.transactionCategories, JSON.stringify(next))
  }

  return { categories, loading, save }
}
