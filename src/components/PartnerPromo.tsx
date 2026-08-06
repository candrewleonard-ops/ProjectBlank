import { useEffect, useState } from 'react'
import { SITE_NAME, FACEBOOK_PAGE_URL, FACEBOOK_CARSON_URL } from '../lib/site'

const STORAGE_KEY = 'partner-promo-dismissed'

const POINTS = [
  {
    icon: '📉',
    title: 'Well-funded deals below 70% LTARV',
    text: 'We buy with margin built in — see the LTARV on every deal page.',
  },
]

export default function PartnerPromo() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => {
      setOpen(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, 1400)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
    setTimeout(() => setOpen(false), 500)
  }

  if (!open) return null

  return (
    <div
      className={`fixed bottom-3 right-3 z-40 max-h-[75vh] w-[75vw] max-w-[340px] overflow-y-auto transition-all duration-500 ease-out sm:bottom-4 sm:right-4 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      }`}
      role="complementary"
      aria-label="Partner with us"
    >
      <div className="overflow-hidden rounded-2xl border border-brand-500/30 bg-ink-900 shadow-2xl shadow-black/60">
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
              Partner with us
            </p>
            <button
              onClick={dismiss}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <h3 className="mt-1 text-base font-semibold leading-snug text-white">
            See home blueprints, budget per project, and projected net profits.
          </h3>

          <ul className="mt-3 flex flex-col gap-2.5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-sm">
                  {p.icon}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-white">{p.title}</span>
                  <span className="block text-[11px] leading-relaxed text-ink-400">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2">
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 py-2.5 text-center text-[13px] font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              Follow {SITE_NAME}
            </a>
            <a
              href={FACEBOOK_CARSON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-brand-500/40 py-2.5 text-center text-[13px] font-semibold text-brand-400 transition-colors hover:bg-brand-500/10"
            >
              Follow Carson on Facebook
            </a>
            <button
              onClick={dismiss}
              className="rounded-lg bg-brand-400/15 py-2.5 text-[13px] font-semibold text-brand-300 transition-colors hover:bg-brand-400/25 cursor-pointer"
            >
              Keep Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
