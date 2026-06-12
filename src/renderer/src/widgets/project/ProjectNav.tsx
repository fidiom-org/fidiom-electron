import { NavLink } from 'react-router-dom'
import { cn } from '@renderer/lib/cn'

interface ProjectNavProps {
  projectId: string
}

const tabs = [
  { label: 'Overview', path: (id: string) => `/projects/${id}` },
  { label: 'Plan', path: (id: string) => `/projects/${id}/plan` }
]

export const ProjectNav = ({ projectId }: ProjectNavProps) => {
  return (
    <nav className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1">
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.path(projectId)}
          end={tab.label === 'Overview'}
          className={({ isActive }) =>
            cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
