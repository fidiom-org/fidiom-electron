import { useState } from 'react'
import { type TransactionDraft } from '@renderer/entities/transaction'
import { useCreateTransaction } from '@renderer/features/create-transaction/model/use-create-transaction'
import { TransactionFormFields } from '@renderer/features/create-transaction/ui/TransactionFormFields'
import ReceiptUpload, {
  type ReceiptPrefill
} from '@renderer/features/create-transaction/ui/ReceiptUpload'
import { Form, FormButton } from '@renderer/shared/ui'

type Step = 'upload' | 'form'

interface CreateTransactionFormProps {
  onCreated?: (draft: TransactionDraft) => void
}

export const CreateTransactionForm = ({ onCreated }: CreateTransactionFormProps) => {
  const { form, submit } = useCreateTransaction(onCreated)
  const [step, setStep] = useState<Step>('upload')

  const goToForm = (prefill: ReceiptPrefill | null): void => {
    form.reset({
      type: 'expense',
      amount: prefill?.amount ?? '',
      category: '',
      date: prefill?.date ?? '',
      description: prefill?.description ?? ''
    })
    setStep('form')
  }

  if (step === 'upload') {
    return <ReceiptUpload onContinue={goToForm} />
  }

  return (
    <Form form={form} onSubmit={submit} className="space-y-4">
      <TransactionFormFields />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep('upload')}
          className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
        >
          ← Back to photo
        </button>
        <FormButton pendingLabel="Saving…" className="ml-auto">
          Create transaction
        </FormButton>
      </div>
    </Form>
  )
}
