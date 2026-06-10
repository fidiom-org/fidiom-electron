import { useState } from 'react'
import { type TransactionDraft } from '@renderer/entities/transaction'
import { useCreateTransaction } from '@renderer/features/create-transaction/model/use-create-transaction'
import { TransactionTypeToggle } from '@renderer/features/create-transaction/ui/TransactionTypeToggle'
import { CategorySelect } from '@renderer/features/create-transaction/ui/CategorySelect'
import ReceiptUpload, {
  type ReceiptPrefill
} from '@renderer/features/create-transaction/ui/ReceiptUpload'
import { Form, FormField, FormButton } from '@renderer/shared/ui'
import { Input } from '@renderer/components/ui/Input'

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
      <FormField name="type" label="Type" required>
        {(field) => <TransactionTypeToggle value={field.value} onChange={field.onChange} />}
      </FormField>

      <FormField name="amount" label="Amount" required>
        {(field) => <Input type="number" step="0.01" placeholder="0.00" {...field} />}
      </FormField>

      <FormField name="category" label="Category" required>
        {(field) => <CategorySelect value={field.value} onChange={field.onChange} />}
      </FormField>

      <FormField name="date" label="Date" required>
        {(field) => <Input type="date" {...field} />}
      </FormField>

      <FormField name="description" label="Description">
        {(field) => <Input placeholder="Optional" {...field} />}
      </FormField>

      {form.formState.errors.root && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {form.formState.errors.root.message}
        </p>
      )}

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
