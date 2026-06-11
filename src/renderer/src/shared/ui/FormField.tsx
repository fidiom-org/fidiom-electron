import { Controller, useFormContext } from 'react-hook-form'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import type { ReactNode } from 'react'

interface FormFieldProps {
  name: string
  label?: ReactNode
  required?: boolean
  children: (field: ControllerRenderProps<FieldValues, string>) => ReactNode
}

export const FormField = ({ name, label, required, children }: FormFieldProps) => {
  const {
    control,
    formState: { errors }
  } = useFormContext()
  const message = errors[name]?.message as string | undefined

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="space-y-1.5">
          {label && (
            <span className="block text-sm font-medium text-zinc-400">
              {label}
              {required && <span className="text-rose-400"> *</span>}
            </span>
          )}
          {children(field)}
          {message && <p className="mt-1 text-xs text-rose-400">{message}</p>}
        </div>
      )}
    />
  )
}
