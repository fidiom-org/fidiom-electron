import type { ReactNode } from 'react'
import { NavLink, useMatches } from 'react-router-dom'
import { useAuth } from '@renderer/features/auth/AuthContext'
import { useProjectStoreHydration } from '@renderer/entities/project'
import { Button } from '@renderer/components/ui/Button'
import { cn } from '@renderer/lib/cn'
import { ArrowLeftRight, ChartColumn, Database, FolderKanban, Settings } from 'lucide-react'
import logoImg from '../../../../../resources/icon.png'
const nav = [
  { label: 'Dashboard', icon: <ChartColumn />, path: '/' },
  { label: 'Projects', icon: <FolderKanban />, path: '/projects' },
  { label: 'Transactions', icon: <ArrowLeftRight />, path: '/transactions' },
  { label: 'Models', icon: <Database />, path: '/chats' },
  { label: 'Settings', icon: <Settings />, path: '/settings' }
]

interface RouteHandle {
  title?: string
}

interface AppShellProps {
  children: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  const { lock } = useAuth()
  const projectsReady = useProjectStoreHydration()
  const matches = useMatches()
  const title =
    [...matches]
      .reverse()
      .map((match) => (match.handle as RouteHandle | undefined)?.title)
      .find(Boolean) ?? 'Fidiom'

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-60 flex-col border-r border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <img src={logoImg} alt="Fidiom" className="h-8 w-8 rounded-xl" />
          <span className="font-semibold">Fidiom</span>
        </div>
        <nav className="space-y-1">
          {nav.map((item) =>
            item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/' || item.path === '/projects'}
                className={({ isActive }) =>
                  cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  )
                }
              >
                <span className="text-zinc-500">{item.icon}</span>
                {item.label}
              </NavLink>
            ) : (
              <button
                key={item.label}
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-zinc-500">{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>
        <div className="mt-auto rounded-xl border border-zinc-800 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="text-emerald-400">🔓</span> Vault unlocked
          </p>
          <p className="truncate text-xs text-zinc-500">Encrypted local store</p>
          <Button variant="ghost" className="mt-2 w-full" onClick={lock}>
            Lock
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-zinc-800 px-8 py-5">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Connected
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {!projectsReady ? <p className="text-sm text-zinc-500">Loading workspace…</p> : children}
        </main>
      </div>
    </div>
  )
}
