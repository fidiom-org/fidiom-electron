import { Link } from 'react-router-dom'
import type { Project } from '@renderer/entities/project'
import { useProjects } from '@renderer/entities/project'
import { MonthPicker } from '@renderer/features/dashboard-period/ui/MonthPicker'
import { Button } from '@renderer/components/ui/Button'
import { Select } from '@renderer/shared/ui/Select'
import { ProjectNav } from './ProjectNav'

interface ProjectDashboardToolbarProps {
  project: Project
  month: number
  year: number
  onMonthChange: (value: string) => void
  onAddPayment: () => void
  onProjectChange: (projectId: string) => void
}

export const ProjectDashboardToolbar = ({
  project,
  month,
  year,
  onMonthChange,
  onAddPayment,
  onProjectChange
}: ProjectDashboardToolbarProps) => {
  const projects = useProjects()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-48">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Project
            </span>
            <Select
              value={project.id}
              onChange={(e) => {
                const id = e.target.value
                if (id !== project.id) onProjectChange(id)
              }}
              options={projects.map((item) => ({ value: item.id, label: item.name }))}
            />
          </label>
          <MonthPicker month={month} year={year} onChange={onMonthChange} />
          <Link
            to="/projects"
            className="pb-2.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            All projects
          </Link>
        </div>
        <Button onClick={onAddPayment}>+ Payment</Button>
      </div>
      <ProjectNav projectId={project.id} />
    </div>
  )
}
