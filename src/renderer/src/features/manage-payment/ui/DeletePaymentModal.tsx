import { useState } from 'react'
import type { Payment } from '@renderer/entities/project'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { Modal } from '@renderer/shared/ui/Modal'
import { formatCurrency } from '@renderer/shared/lib/format'

interface DeletePaymentModalProps {
  payment: Payment | null
  currency: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export const DeletePaymentModal = ({
  payment,
  currency,
  onClose,
  onConfirm
}: DeletePaymentModalProps) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = (): void => {
    if (!reason.trim()) {
      setError('Reason is required')
      return
    }
    onConfirm(reason.trim())
    setReason('')
    setError('')
  }

  const handleClose = (): void => {
    setReason('')
    setError('')
    onClose()
  }

  return (
    <Modal open={payment !== null} onClose={handleClose} title="Delete payment">
      {payment && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Delete <span className="text-zinc-200">{payment.vendor}</span> (
            {formatCurrency(payment.amount, currency)})? This can be reviewed in change history.
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-400">
              Reason for deletion <span className="text-rose-400">*</span>
            </span>
            <Input
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              placeholder="Why are you deleting this?"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-rose-600 hover:bg-rose-500"
              onClick={handleConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
