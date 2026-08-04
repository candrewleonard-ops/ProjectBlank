import { useEffect, useState } from 'react'
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../lib/site'

const STORAGE_KEY = 'partner-promo-dismissed'

const POINTS = [
  {
    icon: '🛡️',
    title: 'Second-position liens',
    text: 'Our lenders allow them — Rain City Capital outright, Kiavi case by case — and our LLC partners with you, including equity in our projects.',
  },
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
      className={`fixed bottom-4 right-4 z-40 w-[min(94vw,390px)] transition-all duration-500 ease-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      }`}
      role="complementary"
      aria-label="Partner with us"
    >
      <div className="overflow-hidden rounded-2xl border border-brand-500/30 bg-ink-900 shadow-2xl shadow-black/60">
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />

        <div className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
              Partner with us
            </p>
            <button
              onClick={dismiss}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            See home blueprints, budget per project, and projected net profits.
          </h3>

          <ul className="mt-4 flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-base">
                  {p.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{p.title}</span>
                  <span className="block text-xs leading-relaxed text-ink-400">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex gap-2">
            <a
              href={CONTACT_PHONE_HREF}
              className="flex-1 rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 py-2.5 text-center text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              Call {CONTACT_PHONE}
            </a>
            <button
              onClick={dismiss}
              className="rounded-lg border border-ink-600 px-3.5 py-2.5 text-sm font-medium text-ink-300 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
            >
              Keep browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
