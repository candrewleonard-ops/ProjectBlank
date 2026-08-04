import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function InquiryModal({
  dealId,
  dealTitle,
  onClose,
}: {
  dealId: string
  dealTitle: string
  onClose: () => void
}) {
  const { user, profile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() && !phone.trim()) {
      setError('Add an email or a phone number so we can reach you.')
      return
    }
    setSubmitting(true)
    const { error: insertError } = await supabase.from('deal_inquiries').insert({
      deal_id: dealId,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      message: message.trim() || null,
      user_id: user?.id ?? null,
    })
    setSubmitting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setSent(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900 shadow-2xl shadow-black/50"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-5 grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
        >
          ✕
        </button>

        <div className="px-6 pb-6 pt-7">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-500/15 ring-8 ring-brand-500/5">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-lg font-semibold text-white">Got it — thanks!</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-400">
                Your inquiry about <span className="font-medium text-ink-200">{dealTitle}</span> is
                in. We'll reach out shortly to talk details.
              </p>
              <button
                onClick={onClose}
                className="mt-5 rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h2 id="inquiry-modal-title" className="text-lg font-semibold text-white">
                Partner on this deal
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Interested in {dealTitle}? Leave your info and we'll get back to you.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-400">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                    placeholder="Your name"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-400">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-400">
                    Message <span className="text-ink-600">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                    placeholder="I'd like to hear more about financing this project…"
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
                  className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Sending…' : 'Send inquiry'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
