import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@renderer/features/auth/AuthContext'
import { Button } from '@renderer/components/ui/Button'

const CONFIRM_WORD = 'RESET'

export const ResetPage = (): React.JSX.Element => {
  const { reset } = useAuth()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canReset = confirmText.trim().toUpperCase() === CONFIRM_WORD

  const handleReset = async (): Promise<void> => {
    if (!canReset || submitting) return
    setSubmitting(true)
    await reset()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="relative grid h-screen place-items-center overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/20 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-600/90 text-lg font-bold">
            !
          </div>
          <h1 className="text-xl font-semibold">Reset master key</h1>
        </div>

        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
          This permanently deletes the encrypted database. All data is lost and cannot be recovered
          — there is no backup. You will then create a brand-new master key.
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-400">
            Type <span className="font-mono text-zinc-200">{CONFIRM_WORD}</span> to confirm
          </span>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-red-500/50"
            placeholder={CONFIRM_WORD}
          />
        </label>

        <Button
          onClick={handleReset}
          disabled={!canReset || submitting}
          className="mt-4 w-full bg-red-600 hover:bg-red-500"
        >
          {submitting ? 'Resetting…' : 'Delete data & reset'}
        </Button>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link to="/auth" className="text-zinc-400 underline hover:text-zinc-200">
            Back
          </Link>
        </p>
      </div>
    </div>
  )
}
