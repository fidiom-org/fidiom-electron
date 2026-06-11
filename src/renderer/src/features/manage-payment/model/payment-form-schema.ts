import { z } from 'zod'

export const paymentFormSchema = z
  .object({
    vendor: z.string().trim().min(1, 'Vendor is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    type: z.enum(['recurring', 'one-time']),
    category: z.string().min(1, 'Category is required'),
    customCategory: z.string().optional(),
    date: z.string().optional(),
    billingDay: z.coerce.number().int().min(1).max(28).optional().or(z.literal('')),
    note: z.string().optional(),
    reason: z.string().optional()
  })
  .superRefine((values, ctx) => {
    const category = values.category === 'Other' ? values.customCategory?.trim() : values.category

    if (!category) {
      ctx.addIssue({
        code: 'custom',
        message: 'Category is required',
        path: ['customCategory']
      })
    }

    if (values.type === 'one-time' && !values.date) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date is required for one-time payments',
        path: ['date']
      })
    }

    if (
      values.type === 'recurring' &&
      (values.billingDay === '' || values.billingDay === undefined)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Billing day is required for recurring payments',
        path: ['billingDay']
      })
    }
  })

export type PaymentFormInput = z.input<typeof paymentFormSchema>
export type PaymentFormValues = z.output<typeof paymentFormSchema>

export const toPaymentInput = (values: PaymentFormValues, direction: 'expense' | 'income') => {
  const category =
    values.category === 'Other' ? (values.customCategory?.trim() ?? '') : values.category

  return {
    direction,
    vendor: values.vendor,
    amount: values.amount,
    type: values.type,
    category,
    date: values.type === 'one-time' ? (values.date ?? null) : null,
    billingDay: values.type === 'recurring' ? Number(values.billingDay) : null,
    note: values.note?.trim() || null
  }
}
