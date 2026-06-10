import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@renderer/features/auth/AuthContext";
import Button from "@renderer/components/ui/Button";
import { ChartColumn, Database, Settings } from "lucide-react";

const nav = [
  { label: "Dashboard", icon: <ChartColumn />, path: "/" },
  { label: "Models", icon: <Database />, path: null },
  { label: "Settings", icon: <Settings />, path: null },
];

function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.JSX.Element {
  const { lock } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-60 flex-col border-r border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold">
            F
          </span>
          <span className="font-semibold">Fidiom</span>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = item.path === pathname;
            return (
              <button
                key={item.label}
                disabled={!item.path}
                onClick={() => item.path && navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors
                ${
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span className="text-zinc-500">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-zinc-800 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="text-emerald-400">🔓</span> Vault unlocked
          </p>
          <p className="truncate text-xs text-zinc-500">
            Encrypted local store
          </p>
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
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
