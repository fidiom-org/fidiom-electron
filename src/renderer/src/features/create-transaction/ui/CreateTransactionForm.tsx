import { type TransactionDraft } from '@renderer/entities/transaction'
import { useCreateTransaction } from '@renderer/features/create-transaction/model/use-create-transaction'
import { TransactionTypeToggle } from '@renderer/features/create-transaction/ui/TransactionTypeToggle'
import { CategorySelect } from '@renderer/features/create-transaction/ui/CategorySelect'
import { Form, FormField, FormButton } from '@renderer/shared/ui'
import { Input } from '@renderer/components/ui/Input'

interface CreateTransactionFormProps {
  onCreated?: (draft: TransactionDraft) => void
}

export const CreateTransactionForm = ({
  onCreated
}: CreateTransactionFormProps): React.JSX.Element => {
  const { form, submit } = useCreateTransaction(onCreated)

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

      <FormButton pendingLabel="Saving…" className="w-full">
        Create transaction
      </FormButton>
    </Form>
  )
}
