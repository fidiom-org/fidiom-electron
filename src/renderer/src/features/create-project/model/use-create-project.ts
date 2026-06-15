import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  createProject,
  type CreateProjectInput,
  type ProjectCurrency
} from '@renderer/entities/project'
import { SETTING_KEYS } from '@renderer/features/settings'
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

  // Seed the currency from the user's saved default, unless they already touched it.
  useEffect(() => {
    let active = true
    window.settingsAPI.get(SETTING_KEYS.defaultCurrency).then((saved) => {
      if (!active || !saved) return
      if (!form.formState.dirtyFields.currency && !form.formState.isSubmitted) {
        form.setValue('currency', saved as CreateProjectFormInput['currency'])
      }
    })
    return () => {
      active = false
    }
  }, [form])

  const submit = form.handleSubmit(async (values) => {
    const input: CreateProjectInput = {
      name: values.name,
      currency: values.currency as ProjectCurrency,
      initialCash: values.initialCash === '' ? undefined : Number(values.initialCash),
      description: values.description?.trim() || undefined
    }
    const project = await createProject(input)
    onCreated(project.id)
  })

  return { form, submit }
}
