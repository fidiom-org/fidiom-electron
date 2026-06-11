import { useEffect, useState } from 'react'

export const useSetting = (
  key: string,
  fallback: string
): {
  value: string
  loading: boolean
  update: (next: string) => Promise<void>
} => {
  const [value, setValue] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    window.settingsAPI
      .get(key)
      .then((stored) => {
        if (active && stored != null) setValue(stored)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [key])

  const update = async (next: string): Promise<void> => {
    setValue(next)
    await window.settingsAPI.set(key, next)
  }

  return { value, loading, update }
}
