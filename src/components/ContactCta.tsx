import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import {
  SITE_NAME,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  FACEBOOK_PAGE_URL,
  FACEBOOK_CARSON_URL,
} from '../lib/site'

// The "Contact us" destination — the header link jumps here.
export default function ContactCta() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: insertError } = await supabase.from('subscribers').insert({
      email: email.trim().toLowerCase(),
      wants_deal_emails: true,
      wants_live_updates: true,
    })
    setSubmitting(false)
    if (insertError && !insertError.message.toLowerCase().includes('duplicate')) {
      setError("Couldn't save that — double-check the email, or just call us.")
      return
    }
    setDone(true)
  }

  return (
    <section
      id="contact"
      className="mt-12 scroll-mt-20 overflow-hidden rounded-2xl border border-brand-500/25 bg-gradient-to-b from-ink-900 to-ink-950"
    >
      <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />

      <div className="px-5 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
            Stay in the loop
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Get our deals, updates, and real estate tips
          </h2>
          <p className="mx-auto mt-3 text-sm leading-relaxed text-ink-400">
            Drop your name and email and we'll send new projects, progress updates, and the
            tricks we've learned flipping houses — no spam, unsubscribe anytime.
          </p>
        </div>

        {done ? (
          <div className="mx-auto mt-7 max-w-md rounded-xl border border-brand-500/30 bg-brand-500/10 px-5 py-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-500/20 text-xl">
              ✅
            </div>
            <p className="font-semibold text-white">You're on the list{name ? `, ${name.split(' ')[0]}` : ''}!</p>
            <p className="mt-1.5 text-sm text-ink-400">
              Watch your inbox — and call {CONTACT_PHONE} any time you want to talk deals.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-7 flex max-w-md flex-col gap-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-base text-white outline-none focus:border-brand-500"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-base text-white outline-none focus:border-brand-500"
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
              {submitting ? 'Sending…' : 'Send me updates'}
            </button>
          </form>
        )}

        <div className="mx-auto mt-7 max-w-md border-t border-ink-700/60 pt-6 text-center">
          <p className="text-sm text-ink-400">Rather talk right now?</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href={CONTACT_PHONE_HREF}
              className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:border-brand-500 hover:text-brand-400"
            >
              📞 Call or text {CONTACT_PHONE}
            </a>
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:border-brand-500 hover:text-brand-400"
            >
              Follow {SITE_NAME}
            </a>
            <a
              href={FACEBOOK_CARSON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:border-brand-500 hover:text-brand-400"
            >
              DM Carson
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
