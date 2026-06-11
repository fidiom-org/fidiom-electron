import { zodResolver } from '@hookform/resolvers/zod'
import {
  PLAN_METRIC_DEFAULT_OPERATORS,
  PLAN_METRIC_LABELS,
  PLAN_METRICS,
  PLAN_OPERATOR_LABELS,
  type PlanTarget
} from '@renderer/entities/project'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { Form, FormButton, FormField } from '@renderer/shared/ui'
import { useForm } from 'react-hook-form'
import {
  planFormSchema,
  toPlanFormValues,
  toPlanTargetInputs,
  type PlanFormInput,
  type PlanFormValues
} from '../model/plan-form-schema'

interface PlanTargetsFormProps {
  targets: PlanTarget[]
  submitLabel: string
  onCancel: () => void
  onSubmit: (inputs: ReturnType<typeof toPlanTargetInputs>) => void
}

export const PlanTargetsForm = ({
  targets,
  submitLabel,
  onCancel,
  onSubmit
}: PlanTargetsFormProps) => {
  const form = useForm<PlanFormInput, unknown, PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: toPlanFormValues(targets)
  })

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(toPlanTargetInputs(values))
  })

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-zinc-500">
        Set targets for this period. Leave blank to skip a metric.
      </p>

      {PLAN_METRICS.map((metric) => {
        const operator = PLAN_METRIC_DEFAULT_OPERATORS[metric]
        const suffix = metric === 'runway' ? 'mo' : undefined

        return (
          <FormField
            key={metric}
            name={metric}
            label={
              <span>
                {PLAN_METRIC_LABELS[metric]}{' '}
                <span className="text-zinc-600">
                  {PLAN_OPERATOR_LABELS[operator]}
                  {suffix ? ` (${suffix})` : ''}
                </span>
              </span>
            }
          >
            {(field) => (
              <Input
                type="number"
                min={0}
                step={metric === 'runway' ? 0.1 : 1}
                placeholder="No target"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          </FormField>
        )
      })}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <FormButton>{submitLabel}</FormButton>
      </div>
    </Form>
  )
}
