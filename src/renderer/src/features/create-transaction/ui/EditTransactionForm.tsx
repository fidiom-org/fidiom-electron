import { type TransactionListItem } from '@renderer/entities/transaction'
import { useEditTransaction } from '@renderer/features/create-transaction/model/use-edit-transaction'
import { TransactionFormFields } from '@renderer/features/create-transaction/ui/TransactionFormFields'
import { Form, FormButton } from '@renderer/shared/ui'

interface EditTransactionFormProps {
  transaction: TransactionListItem
  onSaved?: () => void
}

export const EditTransactionForm = ({ transaction, onSaved }: EditTransactionFormProps) => {
  const { form, submit } = useEditTransaction(transaction, onSaved)

  return (
    <Form form={form} onSubmit={submit} className="space-y-4">
      <TransactionFormFields />
      <FormButton pendingLabel="Saving…" className="ml-auto">
        Update transaction
      </FormButton>
    </Form>
  )
}
