import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  saveProjectPlanTargets,
  useProject,
  useProjectPlan,
  useProjectPlanTargets
} from '@renderer/entities/project'
import { PlanTargetsForm } from '@renderer/features/manage-plan'
import { usePlanPeriod } from '@renderer/features/plan-period'
import { Modal } from '@renderer/shared/ui/Modal'
import { PlanMetricsGrid } from '@renderer/widgets/project/PlanMetricsGrid'
import { PlanToolbar } from '@renderer/widgets/project/PlanToolbar'

export const ProjectPlanPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const period = usePlanPeriod()
  const project = useProject(projectId)
  const plan = useProjectPlan(projectId, period)
  const targets = useProjectPlanTargets(projectId, period)
  const [editOpen, setEditOpen] = useState(false)

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  if (!project || !plan) {
    return <Navigate to="/projects" replace />
  }

  const handleProjectChange = (id: string): void => {
    navigate(`/projects/${id}/plan`)
  }

  return (
    <div className="space-y-6">
      <PlanToolbar
        project={project}
        period={period}
        onGranularityChange={period.setGranularity}
        onMonthChange={period.setFromMonthInput}
        onProjectChange={handleProjectChange}
        onEditPlan={() => setEditOpen(true)}
      />

      <PlanMetricsGrid plan={plan} currency={project.currency} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit plan targets">
        <PlanTargetsForm
          targets={targets}
          submitLabel="Save plan"
          onCancel={() => setEditOpen(false)}
          onSubmit={(inputs) => {
            saveProjectPlanTargets(projectId, period, inputs)
            setEditOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}
