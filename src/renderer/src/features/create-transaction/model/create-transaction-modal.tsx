import { createContext, useContext, useState, type ReactNode } from 'react'
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
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const open = (): void => setIsOpen(true)
  const close = (): void => setIsOpen(false)
  const handleCreated = (): void => close()

  return (
    <CreateTransactionModalContext.Provider value={{ open }}>
      {children}
      <Modal open={isOpen} onClose={close} title="New transaction">
        <CreateTransactionForm onCreated={handleCreated} />
      </Modal>
    </CreateTransactionModalContext.Provider>
  )
}
