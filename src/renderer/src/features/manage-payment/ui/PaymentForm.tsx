import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Payment, PaymentDirection } from '@renderer/entities/project'
import { getCategoriesForDirection } from '@renderer/entities/project'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { Form, FormButton, FormField } from '@renderer/shared/ui'
import { Select } from '@renderer/shared/ui/Select'
import {
  paymentFormSchema,
  toPaymentInput,
  type PaymentFormInput,
  type PaymentFormValues
} from '../model/payment-form-schema'

interface PaymentFormProps {
  direction: PaymentDirection
  payment?: Payment
  requireReason?: boolean
  submitLabel: string
  onSubmit: (values: ReturnType<typeof toPaymentInput> & { reason?: string }) => void
  onCancel: () => void
}

const toFormValues = (
  payment: Payment | undefined,
  direction: PaymentDirection
): PaymentFormInput => {
  if (!payment) {
    return {
      vendor: '',
      amount: '',
      type: 'recurring',
      category: getCategoriesForDirection(direction)[0],
      customCategory: '',
      date: '',
      billingDay: 1,
      note: '',
      reason: ''
    }
  }

  const presetCategories = [...getCategoriesForDirection(payment.direction)] as string[]
  const isPreset = presetCategories.includes(payment.category)

  return {
    vendor: payment.vendor,
    amount: payment.amount,
    type: payment.type,
    category: isPreset ? payment.category : 'Other',
    customCategory: isPreset ? '' : payment.category,
    date: payment.date ?? '',
    billingDay: payment.billingDay ?? '',
    note: payment.note ?? '',
    reason: ''
  }
}

export const PaymentForm = ({
  direction,
  payment,
  requireReason = false,
  submitLabel,
  onSubmit,
  onCancel
}: PaymentFormProps) => {
  const form = useForm<PaymentFormInput, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: toFormValues(payment, direction)
  })

  const type = useWatch({ control: form.control, name: 'type' })
  const category = useWatch({ control: form.control, name: 'category' })
  const categories = getCategoriesForDirection(direction)

  useEffect(() => {
    if (!payment) {
      form.setValue('category', categories[0])
    }
  }, [categories, form, payment])

  const handleSubmit = form.handleSubmit((values) => {
    if (requireReason && !values.reason?.trim()) {
      form.setError('reason', { message: 'Reason is required when editing' })
      return
    }

    onSubmit({
      ...toPaymentInput(values, direction),
      reason: values.reason?.trim()
    })
  })

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-4">
      <FormField name="vendor" label={direction === 'income' ? 'Source' : 'Vendor'} required>
        {(field) => <Input placeholder="Vercel" {...field} />}
      </FormField>

      <FormField name="amount" label="Amount" required>
        {(field) => <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />}
      </FormField>

      <FormField name="type" label="Type" required>
        {(field) => (
          <Select
            options={[
              { value: 'recurring', label: 'Recurring' },
              { value: 'one-time', label: 'One-time' }
            ]}
            {...field}
          />
        )}
      </FormField>

      <FormField name="category" label="Category" required>
        {(field) => (
          <Select options={categories.map((name) => ({ value: name, label: name }))} {...field} />
        )}
      </FormField>

      {category === 'Other' && (
        <FormField name="customCategory" label="Custom category" required>
          {(field) => <Input placeholder="Category name" {...field} />}
        </FormField>
      )}

      {type === 'one-time' ? (
        <FormField name="date" label="Date" required>
          {(field) => <Input type="date" {...field} />}
        </FormField>
      ) : (
        <FormField name="billingDay" label="Billing day" required>
          {(field) => <Input type="number" min="1" max="28" placeholder="1" {...field} />}
        </FormField>
      )}

      <FormField name="note" label="Note">
        {(field) => <Input placeholder="Optional" {...field} />}
      </FormField>

      {requireReason && (
        <FormField name="reason" label="Reason for change" required>
          {(field) => <Input placeholder="Why are you changing this?" {...field} />}
        </FormField>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <FormButton className="flex-1">{submitLabel}</FormButton>
      </div>
    </Form>
  )
}
