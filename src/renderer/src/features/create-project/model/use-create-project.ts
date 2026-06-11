import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  createProject,
  type CreateProjectInput,
  type ProjectCurrency
} from '@renderer/entities/project'
import {
  createProjectSchema,
  type CreateProjectFormInput,
  type CreateProjectFormValues
} from './create-project-schema'

export const useCreateProject = (onCreated: (projectId: string) => void) => {
  const form = useForm<CreateProjectFormInput, unknown, CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      currency: 'USD',
      initialCash: '',
      description: ''
    }
  })

  const submit = form.handleSubmit((values) => {
    const input: CreateProjectInput = {
      name: values.name,
      currency: values.currency as ProjectCurrency,
      initialCash: values.initialCash === '' ? undefined : Number(values.initialCash),
      description: values.description?.trim() || undefined
    }
    const project = createProject(input)
    onCreated(project.id)
  })

  return { form, submit }
}
