import { createContext, useContext, useState, type ReactNode } from 'react'
import { type TransactionListItem } from '@renderer/entities/transaction'
import { Modal } from '@renderer/shared/ui'
import { CreateTransactionForm } from '@renderer/features/create-transaction/ui/CreateTransactionForm'
import { EditTransactionForm } from '@renderer/features/create-transaction/ui/EditTransactionForm'

interface CreateTransactionModalValue {
  open: () => void
  openEdit: (transaction: TransactionListItem) => void
}

type ModalState = { mode: 'create' } | { mode: 'edit'; transaction: TransactionListItem } | null

const CreateTransactionModalContext = createContext<CreateTransactionModalValue | null>(null)

export const useCreateTransactionModal = (): CreateTransactionModalValue => {
  const ctx = useContext(CreateTransactionModalContext)
  if (!ctx) {
    throw new Error('useCreateTransactionModal must be used within CreateTransactionModalProvider')
  }
  return ctx
}

export const CreateTransactionModalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ModalState>(null)

  const open = (): void => setState({ mode: 'create' })
  const openEdit = (transaction: TransactionListItem): void =>
    setState({ mode: 'edit', transaction })
  const close = (): void => setState(null)

  return (
    <CreateTransactionModalContext.Provider value={{ open, openEdit }}>
      {children}
      <Modal
        open={state !== null}
        onClose={close}
        title={state?.mode === 'edit' ? 'Edit transaction' : 'New transaction'}
      >
        {state?.mode === 'edit' ? (
          <EditTransactionForm transaction={state.transaction} onSaved={close} />
        ) : (
          <CreateTransactionForm onCreated={close} />
        )}
      </Modal>
    </CreateTransactionModalContext.Provider>
  )
}
