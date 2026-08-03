import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SITE_NAME, SITE_TAGLINE } from '../lib/site'

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error)
      } else {
        setNotice('Account created. Check your email to confirm, then sign in.')
        setMode('signin')
      }
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-ink-950">
            {SITE_NAME.charAt(0)}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{SITE_NAME}</h1>
          <p className="mt-1 text-sm text-ink-400">{SITE_TAGLINE}</p>
        </div>

        <div className="rounded-2xl border border-ink-700/60 bg-ink-900/60 p-6 shadow-2xl shadow-black/20">
          <div className="mb-6 flex rounded-lg bg-ink-800 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-md py-1.5 transition-colors cursor-pointer ${
                mode === 'signin' ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-1.5 transition-colors cursor-pointer ${
                mode === 'signup' ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  placeholder="Jane Investor"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          You'll stay signed in on this device until you sign out.
        </p>
      </div>
    </div>
  )
}
