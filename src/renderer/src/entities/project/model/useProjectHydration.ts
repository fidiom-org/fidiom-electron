import { useEffect, useState } from 'react'
import { hydrate } from './store'

export const useProjectStoreHydration = (): boolean => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    hydrate()
      .catch((error) => {
        console.error('[projects] hydrate failed', error)
      })
      .finally(() => {
        if (active) setReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  return ready
}
