import { useSyncExternalStore } from 'react'

let version = 0
const listeners = new Set<() => void>()

export function notifyTransactionsChanged(): void {
  version += 1
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): number {
  return version
}

export function useTransactionsVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}
