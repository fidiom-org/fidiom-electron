import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  initialCash: z.coerce.number().min(0, 'Must be 0 or more').optional().or(z.literal('')),
  description: z.string().optional()
})

export type CreateProjectFormInput = z.input<typeof createProjectSchema>
export type CreateProjectFormValues = z.output<typeof createProjectSchema>
