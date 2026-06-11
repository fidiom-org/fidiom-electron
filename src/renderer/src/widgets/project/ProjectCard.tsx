import { Link } from 'react-router-dom'
import {
  computeBurn,
  computeCash,
  computeRunway,
  useProjectPayments,
  type Project
} from '@renderer/entities/project'
import { Card } from '@renderer/components/ui/Card'
import { formatCurrency } from '@renderer/shared/lib/format'

interface ProjectCardProps {
  project: Project
  period: { month: number; year: number }
}

export const ProjectCard = ({ project, period }: ProjectCardProps) => {
  const payments = useProjectPayments(project.id)
  const burn = computeBurn(payments, period)
  const cash = computeCash(project, payments, period)
  const runway = computeRunway(cash, burn)

  return (
    <Link to={`/projects/${project.id}`} className="block transition-opacity hover:opacity-90">
      <Card className="h-full space-y-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{project.name}</h2>
          {project.description && (
            <p className="mt-1 text-sm text-zinc-500">{project.description}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-zinc-500">Burn</p>
            <p className="font-medium text-zinc-200">{formatCurrency(burn, project.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Runway</p>
            <p className="font-medium text-zinc-200">{runway === null ? '—' : `${runway} mo`}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
