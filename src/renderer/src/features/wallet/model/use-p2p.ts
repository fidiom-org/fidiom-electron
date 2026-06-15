import { useCallback, useEffect, useState } from 'react'

type P2PStatus = Awaited<ReturnType<typeof window.p2pAPI.status>>

interface State {
  starting: boolean
  error: string | null
  status: P2PStatus | null
}

export const useP2P = (): State & { refresh: () => Promise<void> } => {
  const [state, setState] = useState<State>({ starting: true, error: null, status: null })

  const refresh = useCallback(async (): Promise<void> => {
    const status = await window.p2pAPI.status()
    setState((prev) => ({ ...prev, status }))
  }, [])

  useEffect(() => {
    let active = true

    window.p2pAPI
      .start()
      .then(async () => {
        const status = await window.p2pAPI.status()
        if (active) setState({ starting: false, error: null, status })
      })
      .catch((err: Error) => {
        if (active) setState((prev) => ({ ...prev, starting: false, error: err.message }))
      })

    const off = window.p2pAPI.onEvent(() => {
      void refresh()
    })

    return () => {
      active = false
      off()
    }
  }, [refresh])

  return { ...state, refresh }
}

export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
