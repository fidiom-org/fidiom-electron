import { useState } from 'react'
import type { TransactionListItem } from '@renderer/entities/transaction'

export interface TransactionSelection {
  selectionMode: boolean
  selectedItems: TransactionListItem[]
  isSelected: (id: number) => boolean
  enable: () => void
  cancel: () => void
  toggle: (item: TransactionListItem) => void
}

export const useTransactionSelection = (): TransactionSelection => {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Map<number, TransactionListItem>>(new Map())

  const enable = (): void => setSelectionMode(true)

  const cancel = (): void => {
    setSelectionMode(false)
    setSelected(new Map())
  }

  const toggle = (item: TransactionListItem): void => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(item.id)) next.delete(item.id)
      else next.set(item.id, item)
      return next
    })
  }

  return {
    selectionMode,
    selectedItems: Array.from(selected.values()),
    isSelected: (id) => selected.has(id),
    enable,
    cancel,
    toggle
  }
}
