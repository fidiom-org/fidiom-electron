import { useState } from 'react'

/**
 * useState mirrored to localStorage. Used by the mock auth feature to persist
 * the session across reloads; swap for a real token store later.
 */
export const useLocalStorage = <T>(key: string, initial: T): [T, (value: T) => void] => {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const set = (value: T): void => {
    setStored(value)
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore quota / serialization errors */
    }
  }

  return [stored, set]
}
