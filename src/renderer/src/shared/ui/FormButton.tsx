import { useFormContext } from 'react-hook-form'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@renderer/components/ui/Button'

interface FormButtonProps extends ComponentProps<typeof Button> {
  /** Shown instead of children while the form is submitting. */
  pendingLabel?: ReactNode
}

/**
 * Submit button that reads `isSubmitting` from the surrounding <Form> context,
 * auto-disabling and swapping its label while a submit is in flight.
 */
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
