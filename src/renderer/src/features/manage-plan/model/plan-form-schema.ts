import { z } from 'zod'
import {
  PLAN_METRIC_DEFAULT_OPERATORS,
  PLAN_METRICS,
  type PlanMetric,
  type PlanTargetInput,
  type PlanTargetOperator
} from '@renderer/entities/project'

const optionalNumber = z.union([z.string(), z.number()]).transform((value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
})

export const planFormSchema = z.object({
  revenue: optionalNumber,
  burn: optionalNumber,
  cash: optionalNumber,
  mrr: optionalNumber,
  runway: optionalNumber
})

export type PlanFormInput = z.input<typeof planFormSchema>
export type PlanFormValues = z.infer<typeof planFormSchema>

export const toPlanTargetInputs = (values: PlanFormValues): PlanTargetInput[] => {
  const inputs: PlanTargetInput[] = []

  for (const metric of PLAN_METRICS) {
    const value = values[metric]
    if (value === null || value <= 0) continue

    inputs.push({
      metric,
      targetValue: value,
      operator: PLAN_METRIC_DEFAULT_OPERATORS[metric]
    })
  }

  return inputs
}

export const toPlanFormValues = (
  targets: Array<{ metric: PlanMetric; targetValue: number; operator: PlanTargetOperator }>
): PlanFormInput => {
  const values: PlanFormInput = {
    revenue: '',
    burn: '',
    cash: '',
    mrr: '',
    runway: ''
  }

  for (const target of targets) {
    values[target.metric] = target.targetValue
  }

  return values
}
