import { useEffect, useState } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { walletRpc, type WalletIdentity } from '../model/wallet-rpc'
import { useNow } from '../model/use-p2p'
import { formatAgo, formatDuration, shortKey } from '../model/format'

interface ConnectionCardProps {
  remoteKey: string
  connectedAt: number
  lastSeen: number
}

const Stat = ({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement => (
  <div className="rounded-lg bg-zinc-900 px-3 py-2">
    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="mt-0.5 text-sm text-zinc-200">{value}</p>
  </div>
)

export const ConnectionCard = ({
  remoteKey,
  connectedAt,
  lastSeen
}: ConnectionCardProps): React.ReactElement => {
  const now = useNow()
  const [identity, setIdentity] = useState<WalletIdentity | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('Hello from Fibiom')
  const [signature, setSignature] = useState<string | null>(null)

  const measureLatency = async (): Promise<void> => {
    try {
      setLatency(await window.p2pAPI.ping(remoteKey))
    } catch {
      setLatency(null)
    }
  }

  useEffect(() => {
    let active = true
    walletRpc
      .identify(remoteKey)
      .then((id) => active && setIdentity(id))
      .catch((e: Error) => active && setError(e.message))
    void measureLatency()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteKey])

  const refreshBalance = async (): Promise<void> => {
    setBusy('balance')
    setError(null)
    try {
      const b = await walletRpc.getBalances(remoteKey)
      setBalance(b.spark)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const sign = async (): Promise<void> => {
    if (!identity?.evm) return
    setBusy('sign')
    setError(null)
    setSignature(null)
    try {
      setSignature(await walletRpc.signPersonal(remoteKey, message, identity.evm))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-zinc-100">{identity?.label ?? 'Wallet'}</span>
        </div>
        <span className="font-mono text-xs text-zinc-500">{shortKey(remoteKey)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Connected for" value={formatDuration(now - connectedAt)} />
        <Stat label="Last activity" value={formatAgo(lastSeen, now)} />
        <Stat
          label="Latency"
          value={
            <span className="inline-flex items-center gap-1.5">
              {latency === null ? '—' : `${latency} ms`}
              <button
                onClick={() => void measureLatency()}
                className="text-xs text-indigo-400 hover:text-indigo-300"
                title="Re-measure"
              >
                ↻
              </button>
            </span>
          }
        />
      </div>

      <div className="space-y-1.5">
        {(['evm', 'solana', 'spark'] as const).map((chain) => (
          <div key={chain} className="flex items-center gap-2 text-xs">
            <span className="w-12 shrink-0 uppercase tracking-wide text-zinc-500">{chain}</span>
            <code className="flex-1 truncate rounded bg-zinc-900 px-2 py-1 font-mono text-zinc-300">
              {identity?.[chain] ?? '—'}
            </code>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="px-3 py-1.5 text-xs"
          disabled={busy !== null}
          onClick={() => void refreshBalance()}
        >
          {busy === 'balance' ? 'Loading…' : 'Refresh balance'}
        </Button>
        {balance !== null && <span className="text-xs text-zinc-300">⚡ {balance} sats</span>}
      </div>

      <div className="space-y-2 border-t border-zinc-800 pt-3">
        <p className="text-xs text-zinc-500">
          Request a signature (opens an approval in the wallet)
        </p>
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to sign"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
          />
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            disabled={busy !== null || !identity?.evm}
            onClick={() => void sign()}
          >
            {busy === 'sign' ? 'Approve in wallet…' : 'Sign'}
          </Button>
        </div>
        {signature && (
          <code className="block truncate rounded bg-zinc-900 px-2 py-1 font-mono text-xs text-emerald-400">
            {signature}
          </code>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
