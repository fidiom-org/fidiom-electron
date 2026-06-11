import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  notifyTransactionsChanged,
  transactionSchema,
  type TransactionDraft,
  type TransactionInput
} from '@renderer/entities/transaction'
import { saveTransaction } from '@renderer/features/create-transaction/api/save-transaction'

export function useCreateTransaction(onCreated?: (draft: TransactionDraft) => void) {
  const form = useForm<TransactionInput, unknown, TransactionDraft>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'expense', category: '', date: '', description: '' }
  })

  const submit = form.handleSubmit(async (draft) => {
    try {
      await saveTransaction(draft)
      notifyTransactionsChanged()
      onCreated?.(draft)
      form.reset()
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to save transaction'
      })
    }
  })

  return { form, submit }
}
