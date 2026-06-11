import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '@renderer/entities/project'
import { useDashboardPeriod } from '@renderer/features/dashboard-period/model/useDashboardPeriod'
import { CreateProjectForm } from '@renderer/features/create-project'
import { Button } from '@renderer/components/ui/Button'
import { ProjectCard } from '@renderer/widgets/project/ProjectCard'
import { Modal } from '@renderer/shared/ui/Modal'

export const ProjectsPage = () => {
  const projects = useProjects()
  const period = useDashboardPeriod()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  const handleCreated = (projectId: string): void => {
    setCreateOpen(false)
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Projects</h2>
          <p className="mt-1 text-sm text-zinc-500">Startup finances at a glance</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New project</Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">No projects yet.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} period={period} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New project">
        <CreateProjectForm onCreated={handleCreated} />
      </Modal>
    </div>
  )
}
