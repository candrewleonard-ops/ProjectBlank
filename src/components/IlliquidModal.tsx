import { useEffect, useState } from 'react'
import { formatCurrency } from '../lib/format'
import { REHAB_RESERVE_RATE } from '../lib/site'

// Non-blocking financing card, docked bottom-left on the deal page. Slides in,
// stays out of the way, and never traps a click — dismiss with the ✕ or just
// ignore it.
export default function IlliquidModal({
  dealId,
  dealTitle,
  reason,
  rehabBudget,
  onCta,
}: {
  dealId: string
  dealTitle: string
  reason: string | null
  rehabBudget: number | null
  onCta: () => void
}) {
  const storageKey = `illiquid-dismissed-${dealId}`
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(storageKey)) return
    const t = setTimeout(() => {
      setOpen(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId])

  function close() {
    setVisible(false)
    sessionStorage.setItem(storageKey, '1')
    setTimeout(() => setOpen(false), 500)
  }

  if (!open) return null

  const askAmount = rehabBudget !== null ? Math.round(rehabBudget * REHAB_RESERVE_RATE) : null

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 w-[min(94vw,370px)] transition-all duration-500 ease-out ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'
      }`}
      role="complementary"
      aria-label="Financing open on this deal"
    >
      <div className="overflow-hidden rounded-2xl border border-gold-500/30 bg-ink-900 shadow-2xl shadow-black/60">
        <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500" />

        <div className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
              Financing open
            </p>
            <button
              onClick={close}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            {dealTitle} is ready for its repairs
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            The property is secured — we're financing the repair phase and only need{' '}
            <span className="font-semibold text-gold-400">
              15% of the rehab budget
              {askAmount !== null ? ` (about ${formatCurrency(askAmount)})` : ''}
            </span>{' '}
            to keep the work moving. A great spot for a partner to step in.
          </p>

          {reason && (
            <p className="mt-2 text-xs text-ink-500">
              Status: {reason}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                close()
                onCta()
              }}
              className="flex-1 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-gold-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
            >
              I can help finance this
            </button>
            <button
              onClick={close}
              className="rounded-lg border border-ink-600 px-3.5 py-2.5 text-sm font-medium text-ink-300 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
