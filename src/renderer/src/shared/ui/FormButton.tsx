import { useFormContext } from 'react-hook-form'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@renderer/components/ui/Button'

interface FormButtonProps extends ComponentProps<typeof Button> {
  pendingLabel?: ReactNode
}

export const FormButton = ({ children, pendingLabel, disabled, ...props }: FormButtonProps) => {
  const {
    formState: { isSubmitting }
  } = useFormContext()

  return (
    <Button type="submit" disabled={disabled ?? isSubmitting} {...props}>
      {isSubmitting && pendingLabel ? pendingLabel : children}
    </Button>
  )
}
