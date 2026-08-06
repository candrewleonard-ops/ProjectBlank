import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLeadEmail, setLeadEmail, isValidLeadEmail, upsertLead, logLeadEvent } from '../lib/leads'
import { SITE_NAME } from '../lib/site'
import { LogoMark } from './Logo'

// Everyone who isn't signed in gives an email before browsing. No password —
// it just identifies the visitor so their activity rolls up into one lead.
export default function EmailGate() {
  const { user, loading } = useAuth()
  const [needsEmail, setNeedsEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    setNeedsEmail(!user && !getLeadEmail())
  }, [user, loading])

  useEffect(() => {
    if (!needsEmail) return
    // Don't let the page behind scroll while the gate is up.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [needsEmail])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const clean = email.trim().toLowerCase()

    if (!isValidLeadEmail(clean)) {
      setError('Please enter a valid email address ending in .com')
      return
    }

    setSubmitting(true)
    setLeadEmail(clean)
    const { error: upsertError } = await upsertLead(clean)
    if (upsertError) {
      // Never trap a visitor behind a database hiccup — let them in anyway.
      console.warn('lead upsert failed', upsertError.message)
    } else {
      await logLeadEvent('signup')
    }
    setSubmitting(false)
    setNeedsEmail(false)
  }

  if (loading || !needsEmail) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-500/30 bg-ink-900 shadow-2xl shadow-black/60">
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />

        <div className="px-6 py-8 text-center sm:px-8">
          <div className="mx-auto mb-4 flex justify-center text-white">
            <LogoMark className="h-14 w-14" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            See the {SITE_NAME} portfolio
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-400">
            Enter your email to view live deals, budgets, and photos. No password, no account to
            create — we just like knowing who's following the projects.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-center text-base text-white outline-none focus:border-brand-500"
            />
            {error && (
              <p className="rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 py-3 text-base font-semibold text-ink-950 shadow-lg shadow-brand-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'One moment…' : 'View the deals'}
            </button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-ink-500">
            We'll only use it to send project updates. Already have an account?{' '}
            <a href="/login" className="font-medium text-brand-400 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
