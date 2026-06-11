import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  addPayment,
  deletePayment,
  updatePayment,
  useProject,
  useProjectDashboard
} from '@renderer/entities/project'
import type { Payment, PaymentDirection } from '@renderer/entities/project'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { DeletePaymentModal, PaymentForm } from '@renderer/features/manage-payment'
import { Modal } from '@renderer/shared/ui/Modal'
import { ExpenseStructureWidget } from '@renderer/widgets/project/ExpenseStructureWidget'
import { IncomeExpenseBarWidget } from '@renderer/widgets/project/IncomeExpenseBarWidget'
import { PaymentsTable } from '@renderer/widgets/project/PaymentsTable'
import { ProjectDashboardToolbar } from '@renderer/widgets/project/ProjectDashboardToolbar'
import { ProjectSummaryBar } from '@renderer/widgets/project/ProjectSummaryBar'

type PaymentModalState =
  | { mode: 'add'; direction: PaymentDirection }
  | { mode: 'edit'; payment: Payment }
  | null

export const ProjectDashboardPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const period = useDashboardPeriod()
  const project = useProject(projectId)
  const data = useProjectDashboard(projectId, period)
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  if (!project || !data) {
    return <Navigate to="/projects" replace />
  }

  const isEmpty = data.payments.filter((payment) => !payment.deletedAt).length === 0

  const handleProjectChange = (id: string): void => {
    navigate(`/projects/${id}`, { replace: true })
  }

  return (
    <div className="space-y-6">
      <ProjectDashboardToolbar
        project={project}
        month={period.month}
        year={period.year}
        onMonthChange={period.setFromInput}
        onAddPayment={() => setPaymentModal({ mode: 'add', direction: 'expense' })}
        onProjectChange={handleProjectChange}
      />

      <ProjectSummaryBar kpi={data.kpi} currency={project.currency} />

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-sm text-zinc-400">No payments yet.</p>
          <p className="mt-1 text-sm text-zinc-500">Add your first expense or income.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ExpenseStructureWidget slices={data.expenseSlices} />
          <IncomeExpenseBarWidget points={data.monthlyTotals} currency={project.currency} />
        </div>
      )}

      <PaymentsTable
        payments={data.payments}
        period={period}
        currency={project.currency}
        onEdit={(payment) => setPaymentModal({ mode: 'edit', payment })}
        onDelete={setDeleteTarget}
        onAdd={(direction) => setPaymentModal({ mode: 'add', direction })}
      />

      <Modal
        open={paymentModal !== null}
        onClose={() => setPaymentModal(null)}
        title={
          paymentModal?.mode === 'edit'
            ? 'Edit payment'
            : paymentModal?.direction === 'income'
              ? 'Add income'
              : 'Add payment'
        }
      >
        {paymentModal && (
          <PaymentForm
            direction={
              paymentModal.mode === 'edit' ? paymentModal.payment.direction : paymentModal.direction
            }
            payment={paymentModal.mode === 'edit' ? paymentModal.payment : undefined}
            requireReason={paymentModal.mode === 'edit'}
            submitLabel={paymentModal.mode === 'edit' ? 'Save changes' : 'Add payment'}
            onCancel={() => setPaymentModal(null)}
            onSubmit={(values) => {
              if (paymentModal.mode === 'edit') {
                updatePayment(paymentModal.payment.id, {
                  ...values,
                  reason: values.reason ?? ''
                })
              } else {
                addPayment(projectId, values)
              }
              setPaymentModal(null)
            }}
          />
        )}
      </Modal>

      <DeletePaymentModal
        payment={deleteTarget}
        currency={project.currency}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(reason) => {
          if (deleteTarget) {
            deletePayment(deleteTarget.id, { reason })
          }
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
