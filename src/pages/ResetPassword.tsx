import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogoMark } from '../components/Logo'

// Landing page for the password-recovery email link. Supabase puts a session
// in the URL; once here the user just sets a new password.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center text-white">
          <LogoMark className="h-14 w-14" />
        </div>
        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/60 p-6 shadow-2xl shadow-black/20">
          <h1 className="text-lg font-semibold text-white">Set a new password</h1>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Confirm password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
