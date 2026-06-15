import { useEffect, useState } from 'react'
import { addPayment } from '@renderer/entities/project'
import { PaymentForm } from '@renderer/features/manage-payment'
import { Modal } from '@renderer/shared/ui/Modal'
import { InvoiceUpload } from './InvoiceUpload'
import type { InvoicePrefill } from '../model/map-invoice'

interface InvoiceImportModalProps {
  open: boolean
  projectId: string
  onClose: () => void
  onCreated?: () => void
}

export const InvoiceImportModal = ({
  open,
  projectId,
  onClose,
  onCreated
}: InvoiceImportModalProps) => {
  const [prefill, setPrefill] = useState<InvoicePrefill | null>(null)

  useEffect(() => {
    if (open) setPrefill(null)
  }, [open])

  const title = prefill ? 'Review payment' : 'Scan invoice'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {prefill ? (
        <PaymentForm
          direction="expense"
          defaults={prefill}
          submitLabel="Create payment"
          onCancel={onClose}
          onSubmit={(values) => {
            void (async () => {
              await addPayment(projectId, values)
              onCreated?.()
              onClose()
            })()
          }}
        />
      ) : (
        <InvoiceUpload onContinue={setPrefill} onManual={() => setPrefill({ type: 'one-time' })} />
      )}
    </Modal>
  )
}
