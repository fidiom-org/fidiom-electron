import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  addEmployee,
  addPayment,
  deleteEmployee,
  deletePayment,
  getActiveEmployees,
  updateEmployee,
  updatePayment,
  useProject,
  useProjectDashboard
} from '@renderer/entities/project'
import type { Employee, Payment, PaymentDirection } from '@renderer/entities/project'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { DeleteEmployeeModal, EmployeeForm } from '@renderer/features/manage-employee'
import { DeletePaymentModal, PaymentForm } from '@renderer/features/manage-payment'
import { InvoiceImportModal } from '@renderer/features/parse-invoice'
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

type EmployeeModalState = { mode: 'add' } | { mode: 'edit'; employee: Employee } | null

export const ProjectDashboardPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const period = useDashboardPeriod()
  const project = useProject(projectId)
  const data = useProjectDashboard(projectId, period)
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>(null)
  const [employeeModal, setEmployeeModal] = useState<EmployeeModalState>(null)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | null>(null)
  const [deleteEmployeeTarget, setDeleteEmployeeTarget] = useState<Employee | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  if (!project || !data) {
    return <Navigate to="/projects" replace />
  }

  const hasActivePayments = data.payments.some((payment) => !payment.deletedAt)
  const hasActiveEmployees = getActiveEmployees(data.employees).length > 0
  const isEmpty = !hasActivePayments && !hasActiveEmployees

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
        onScanInvoice={() => setInvoiceOpen(true)}
        onProjectChange={handleProjectChange}
      />

      <ProjectSummaryBar kpi={data.kpi} currency={project.currency} />

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-sm text-zinc-400">No payments yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Add vendors in Expenses or employees under Payroll.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ExpenseStructureWidget slices={data.expenseSlices} />
          <IncomeExpenseBarWidget points={data.monthlyTotals} currency={project.currency} />
        </div>
      )}

      <PaymentsTable
        payments={data.payments}
        employees={data.employees}
        period={period}
        currency={project.currency}
        onEdit={(payment) => setPaymentModal({ mode: 'edit', payment })}
        onDelete={setDeletePaymentTarget}
        onAdd={(direction) => setPaymentModal({ mode: 'add', direction })}
        onEditEmployee={(employee) => setEmployeeModal({ mode: 'edit', employee })}
        onDeleteEmployee={setDeleteEmployeeTarget}
        onAddEmployee={() => setEmployeeModal({ mode: 'add' })}
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
              void (async () => {
                if (paymentModal.mode === 'edit') {
                  await updatePayment(paymentModal.payment.id, {
                    ...values,
                    reason: values.reason ?? ''
                  })
                } else {
                  await addPayment(projectId, values)
                }
                setPaymentModal(null)
              })()
            }}
          />
        )}
      </Modal>

      <Modal
        open={employeeModal !== null}
        onClose={() => setEmployeeModal(null)}
        title={employeeModal?.mode === 'edit' ? 'Edit employee' : 'Add employee'}
      >
        {employeeModal && (
          <EmployeeForm
            employee={employeeModal.mode === 'edit' ? employeeModal.employee : undefined}
            requireReason={employeeModal.mode === 'edit'}
            submitLabel={employeeModal.mode === 'edit' ? 'Save changes' : 'Add employee'}
            onCancel={() => setEmployeeModal(null)}
            onSubmit={(values) => {
              void (async () => {
                if (employeeModal.mode === 'edit') {
                  await updateEmployee(employeeModal.employee.id, {
                    name: values.name,
                    salary: values.salary,
                    reason: values.reason ?? ''
                  })
                } else {
                  await addEmployee(projectId, { name: values.name, salary: values.salary })
                }
                setEmployeeModal(null)
              })()
            }}
          />
        )}
      </Modal>

      <InvoiceImportModal
        open={invoiceOpen}
        projectId={projectId}
        onClose={() => setInvoiceOpen(false)}
      />

      <DeletePaymentModal
        payment={deletePaymentTarget}
        currency={project.currency}
        onClose={() => setDeletePaymentTarget(null)}
        onConfirm={(reason) => {
          if (deletePaymentTarget) {
            void deletePayment(deletePaymentTarget.id, { reason })
          }
          setDeletePaymentTarget(null)
        }}
      />

      <DeleteEmployeeModal
        employee={deleteEmployeeTarget}
        currency={project.currency}
        onClose={() => setDeleteEmployeeTarget(null)}
        onConfirm={(reason) => {
          if (deleteEmployeeTarget) {
            void deleteEmployee(deleteEmployeeTarget.id, { reason })
          }
          setDeleteEmployeeTarget(null)
        }}
      />
    </div>
  )
}
