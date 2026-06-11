import { Link } from 'react-router-dom'
import type { PlanPeriod, PlanPeriodGranularity, Project } from '@renderer/entities/project'
import { useProjects } from '@renderer/entities/project'
import { Button } from '@renderer/components/ui/Button'
import { Select } from '@renderer/shared/ui/Select'
import { PlanPeriodPicker } from './PlanPeriodPicker'
import { ProjectNav } from './ProjectNav'

interface PlanToolbarProps {
  project: Project
  period: PlanPeriod
  onGranularityChange: (granularity: PlanPeriodGranularity) => void
  onMonthChange: (value: string) => void
  onProjectChange: (projectId: string) => void
  onEditPlan: () => void
}

export const PlanToolbar = ({
  project,
  period,
  onGranularityChange,
  onMonthChange,
  onProjectChange,
  onEditPlan
}: PlanToolbarProps) => {
  const projects = useProjects()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-48">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Project
              </span>
              <Select
                value={project.id}
                onChange={(event) => {
                  const id = event.target.value
                  if (id !== project.id) onProjectChange(id)
                }}
                options={projects.map((item) => ({ value: item.id, label: item.name }))}
              />
            </label>
            <PlanPeriodPicker
              period={period}
              onGranularityChange={onGranularityChange}
              onMonthChange={onMonthChange}
            />
            <Link
              to="/projects"
              className="pb-2.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              All projects
            </Link>
          </div>
          <ProjectNav projectId={project.id} />
        </div>
        <Button onClick={onEditPlan}>Edit plan</Button>
      </div>
    </div>
  )
}
