import { CURRENCY_OPTIONS } from '@renderer/entities/project'
import { useCreateProject } from '@renderer/features/create-project/model/use-create-project'
import { Input } from '@renderer/components/ui/Input'
import { Form, FormButton, FormField } from '@renderer/shared/ui'
import { Select } from '@renderer/shared/ui/Select'

interface CreateProjectFormProps {
  onCreated: (projectId: string) => void
}

export const CreateProjectForm = ({ onCreated }: CreateProjectFormProps) => {
  const { form, submit } = useCreateProject(onCreated)

  return (
    <Form form={form} onSubmit={submit} className="space-y-4">
      <FormField name="name" label="Name" required>
        {(field) => <Input placeholder="Acme Labs" {...field} />}
      </FormField>

      <FormField name="currency" label="Currency" required>
        {(field) => (
          <Select
            options={CURRENCY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            {...field}
          />
        )}
      </FormField>

      <FormField name="initialCash" label="Initial cash">
        {(field) => <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />}
      </FormField>

      <FormField name="description" label="Description">
        {(field) => <Input placeholder="Optional" {...field} />}
      </FormField>

      <FormButton className="w-full">Create project</FormButton>
    </Form>
  )
}
