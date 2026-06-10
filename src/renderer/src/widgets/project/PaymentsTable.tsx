import { useState } from 'react'
import type {
  DashboardPeriod,
  Payment,
  PaymentDirection,
  ProjectCurrency
} from '@renderer/entities/project'
import { getPaymentsInPeriod } from '@renderer/entities/project'
import { PaymentHistoryPopover } from '@renderer/features/manage-payment'
import { Button } from '@renderer/components/ui/Button'
import { formatCurrency } from '@renderer/shared/lib/format'
import { cn } from '@renderer/lib/cn'

interface PaymentsTableProps {
  payments: Payment[]
  period: DashboardPeriod
  currency: ProjectCurrency
  onEdit: (payment: Payment) => void
  onDelete: (payment: Payment) => void
  onAdd: (direction: PaymentDirection) => void
}

const tabs: Array<{ id: PaymentDirection; label: string }> = [
  { id: 'expense', label: 'Expenses' },
  { id: 'income', label: 'Income' }
]

const formatSchedule = (payment: Payment): string => {
  if (payment.type === 'recurring') {
    return payment.billingDay ? `day ${payment.billingDay}` : '—'
  }
  return payment.date ?? '—'
}

export const PaymentsTable = ({
  payments,
  period,
  currency,
  onEdit,
  onDelete,
  onAdd
}: PaymentsTableProps) => {
  const [activeTab, setActiveTab] = useState<PaymentDirection>('expense')
  const visible = getPaymentsInPeriod(payments, period, activeTab)
  const vendorLabel = activeTab === 'expense' ? 'Vendor' : 'Source'

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-zinc-800/60 p-1">
          {tabs.map((tab) => {
            const count = getPaymentsInPeriod(payments, period, tab.id).length
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>
        <Button variant="ghost" onClick={() => onAdd(activeTab)}>
          + Add payment
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-zinc-500">
            No {activeTab === 'expense' ? 'expenses' : 'income'} this month.
          </p>
          <Button className="mt-4" onClick={() => onAdd(activeTab)}>
            Add your first payment
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">{vendorLabel}</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Schedule</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((payment) => (
                <tr key={payment.id} className="border-b border-zinc-800/60 last:border-0">
                  <td className="px-5 py-3 text-zinc-100">{payment.vendor}</td>
                  <td className="px-5 py-3 text-zinc-200">
                    {formatCurrency(payment.amount, currency)}
                  </td>
                  <td className="px-5 py-3 capitalize text-zinc-400">{payment.type}</td>
                  <td className="px-5 py-3 text-zinc-400">{payment.category}</td>
                  <td className="px-5 py-3 text-zinc-400">{formatSchedule(payment)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <PaymentHistoryPopover history={payment.history} />
                      <button
                        type="button"
                        onClick={() => onEdit(payment)}
                        className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                        aria-label="Edit payment"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(payment)}
                        className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-rose-300"
                        aria-label="Delete payment"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
