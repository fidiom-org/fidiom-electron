import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form'
import type { FormEventHandler, ReactNode } from 'react'

interface FormProps<TIn extends FieldValues, TCtx, TOut extends FieldValues> {
  form: UseFormReturn<TIn, TCtx, TOut>
  onSubmit: FormEventHandler<HTMLFormElement>
  children: ReactNode
  className?: string
}

/**
 * Wraps a react-hook-form instance in a FormProvider so nested fields can read
 * the form via useFormContext() (no prop drilling), and renders the native
 * <form>. Pass the form returned by useForm and a submit handler.
 */
export const Form = <TIn extends FieldValues, TCtx, TOut extends FieldValues>({
  form,
  onSubmit,
  children,
  className
}: FormProps<TIn, TCtx, TOut>): React.JSX.Element => {
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className={className} noValidate>
        {children}
      </form>
    </FormProvider>
  )
}
