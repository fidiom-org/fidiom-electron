import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  notifyTransactionsChanged,
  transactionSchema,
  type TransactionDraft,
  type TransactionInput,
  type TransactionListItem
} from '@renderer/entities/transaction'
import { updateTransaction } from '@renderer/features/create-transaction/api/update-transaction'

export const useEditTransaction = (transaction: TransactionListItem, onSaved?: () => void) => {
  const form = useForm<TransactionInput, unknown, TransactionDraft>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction.type,
      amount: String(transaction.amount),
      category: transaction.category?.value ?? '',
      date: transaction.date,
      description: transaction.description ?? ''
    }
  })

  const submit = form.handleSubmit(async (draft) => {
    try {
      await updateTransaction(transaction.id, draft)
      notifyTransactionsChanged()
      onSaved?.()
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to update transaction'
      })
    }
  })

  return { form, submit }
}
