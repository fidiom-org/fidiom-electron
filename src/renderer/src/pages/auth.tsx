import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@renderer/features/auth/AuthContext'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { ModelStatus } from '@renderer/components/ui/ModelStatus'

export const AuthPage = () => {
  const navigate = useNavigate()

  const { initialized, setup, unlock } = useAuth()

  const [masterKey, setMasterKey] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const creating = !initialized

  const handleSubmit = async (event): Promise<void> => {
    event.preventDefault()
    setError('')
    if (!masterKey || submitting) return

    if (creating && masterKey !== confirm) {
      setError('Master keys do not match')
      return
    }

    setSubmitting(true)
    try {
      if (creating) {
        await setup(masterKey)
        navigate('/', { replace: true })
      } else {
        const ok = await unlock(masterKey)
        if (ok) navigate('/', { replace: true })
        else setError('Incorrect master key')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid h-screen place-items-center overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-lg font-bold">
            F
          </div>
          <h1 className="text-xl font-semibold">
            {creating ? 'Create your master key' : 'Unlock Fidiom'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {creating
              ? 'This key encrypts your local data'
              : 'Enter your master key to decrypt your data'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Master key"
            type="password"
            placeholder="••••••••••••"
            value={masterKey}
            onChange={(e) => setMasterKey(e.target.value)}
            autoFocus
          />
          {creating && (
            <Input
              label="Confirm master key"
              type="password"
              placeholder="••••••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          {creating && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
              ⚠ Save this key somewhere safe. It is the only way to open your data — it is never
              stored and cannot be recovered or reset.
            </p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? creating
                ? 'Creating…'
                : 'Unlocking…'
              : creating
                ? 'Create master key'
                : 'Unlock'}
          </Button>
        </form>

        <ModelStatus />

        {!creating && (
          <p className="mt-6 text-center text-xs text-zinc-600">
            Lost your master key?{' '}
            <Link to="/reset" className="text-zinc-400 underline hover:text-zinc-200">
              Reset
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
