import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Modal } from '@renderer/shared/ui'
import { CreateTransactionForm } from '@renderer/features/create-transaction/ui/CreateTransactionForm'

interface CreateTransactionModalValue {
  open: () => void
}

const CreateTransactionModalContext = createContext<CreateTransactionModalValue | null>(null)

export const useCreateTransactionModal = (): CreateTransactionModalValue => {
  const ctx = useContext(CreateTransactionModalContext)
  if (!ctx) {
    throw new Error('useCreateTransactionModal must be used within CreateTransactionModalProvider')
  }
  return ctx
}

export const CreateTransactionModalProvider = ({
  children
}: {
  children: ReactNode
}): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const handleCreated = useCallback((): void => close(), [close])

  return (
    <CreateTransactionModalContext.Provider value={{ open }}>
      {children}
      <Modal open={isOpen} onClose={close} title="New transaction">
        <CreateTransactionForm onCreated={handleCreated} />
      </Modal>
    </CreateTransactionModalContext.Provider>
  )
}
