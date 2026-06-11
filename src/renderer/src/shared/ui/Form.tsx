import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form'
import type { FormEventHandler, ReactNode } from 'react'

interface FormProps<TIn extends FieldValues, TCtx, TOut extends FieldValues> {
  form: UseFormReturn<TIn, TCtx, TOut>
  onSubmit: FormEventHandler<HTMLFormElement>
  children: ReactNode
  className?: string
}

export const Form = <TIn extends FieldValues, TCtx, TOut extends FieldValues>({
  form,
  onSubmit,
  children,
  className
}: FormProps<TIn, TCtx, TOut>) => {
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className={className} noValidate>
        {children}
      </form>
    </FormProvider>
  )
}
