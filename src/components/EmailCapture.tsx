import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SITE_NAME } from '../lib/site'
import { LogoMark } from './Logo'

const DISMISS_KEY = 'email-capture-dismissed'
const SAVED_KEY = 'visitor-email'

export default function EmailCapture() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [wantsDeals, setWantsDeals] = useState(true)
  const [wantsUpdates, setWantsUpdates] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) return
    if (localStorage.getItem(DISMISS_KEY) || localStorage.getItem(SAVED_KEY)) return
    const t = setTimeout(() => {
      setOpen(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, 6000)
    return () => clearTimeout(t)
  }, [user])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
    setTimeout(() => setOpen(false), 300)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const normalized = email.trim().toLowerCase()
    const { error: insertError } = await supabase.from('subscribers').insert({
      email: normalized,
      wants_deal_emails: wantsDeals,
      wants_live_updates: wantsUpdates,
    })
    setSubmitting(false)
    // A duplicate email means they're already on the list — that's a success.
    if (insertError && !insertError.message.toLowerCase().includes('duplicate')) {
      setError("Couldn't save that — double-check the email and try again.")
      return
    }
    localStorage.setItem(SAVED_KEY, normalized)
    setDone(true)
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => setOpen(false), 300)
    }, 2600)
  }

  if (!open) return null

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      role="dialog"
      aria-label="Get deal updates by email"
    >
      <div className="border-t border-ink-700/60 bg-ink-900/95 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          {done ? (
            <p className="py-1 text-center text-sm font-medium text-brand-400">
              ✓ You're on the list — deal updates coming your way.
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="hidden text-white sm:block">
                    <LogoMark className="h-9 w-9" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Get first look at our deals
                    </p>
                    <p className="text-xs text-ink-400">
                      {SITE_NAME} sends short, no-fluff emails when a deal opens up or hits a milestone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500 sm:max-w-xs"
                />
                <label className="flex items-center gap-2 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={wantsDeals}
                    onChange={(e) => setWantsDeals(e.target.checked)}
                    className="h-3.5 w-3.5 accent-brand-500"
                  />
                  Email me about new deals
                </label>
                <label className="flex items-center gap-2 text-xs text-ink-300">
                  <input
                    type="checkbox"
                    checked={wantsUpdates}
                    onChange={(e) => setWantsUpdates(e.target.checked)}
                    className="h-3.5 w-3.5 accent-brand-500"
                  />
                  Live project updates
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Saving…' : 'Keep me posted'}
                </button>
              </form>
              {error && <p className="text-xs text-alert-400">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
