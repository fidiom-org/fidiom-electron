import { Card } from '@renderer/components/ui/Card'
import { useP2P, useNow } from '../model/use-p2p'
import { formatDuration } from '../model/format'
import { CopyField } from './CopyField'
import { ConnectionCard } from './ConnectionCard'

export const WalletPanel = (): React.ReactElement => {
  const { starting, error, status } = useP2P()
  const now = useNow()

  const connections = status?.connections ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">This app</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pair your WDK wallet extension to this app over an encrypted peer-to-peer channel.
              Both must run on this machine.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
              status?.running
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-zinc-700/30 text-zinc-400'
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${status?.running ? 'bg-emerald-400' : 'bg-zinc-500'}`}
            />
            {starting ? 'Starting…' : status?.running ? 'Relay online' : 'Offline'}
          </span>
        </div>

        {error && <p className="text-sm text-red-400">Could not start P2P: {error}</p>}

        {status?.publicKey && (
          <>
            <CopyField label="App identity (public key)" value={status.publicKey} />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <CopyField label="Relay address" value={status.wsUrl ?? ''} />
              </div>
            </div>
            {status.startedAt && (
              <p className="text-xs text-zinc-500">
                Relay uptime: {formatDuration(now - status.startedAt)}
              </p>
            )}
          </>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Connected wallets ({connections.length})
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Live connections. Pairing is initiated from the wallet extension&apos;s “Paired apps”
            screen using the identity and relay address above.
          </p>
        </div>

        {connections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center">
            <p className="text-sm text-zinc-400">No wallets connected yet.</p>
            <p className="mt-1 text-xs text-zinc-500">
              Open the wallet extension → Paired apps → paste the app identity + relay address →
              Pair.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.remoteKey}
                remoteKey={conn.remoteKey}
                connectedAt={conn.connectedAt}
                lastSeen={conn.lastSeen}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
