import { useState } from 'react'
import { formatCurrency, formatCompactCurrency } from '../lib/format'
import { RAISE_TOTAL, RAISE_TIERS } from '../lib/site'
import { PARTNERSHIP_INTENT_EVENT } from './ContactCta'
import { logLeadEvent } from '../lib/leads'

// Slim, full-width raise bar pinned to the bottom of the viewport so the
// current raise is always in view while browsing deals.
export default function StickyRaiseBar({ committed }: { committed: number }) {
  const [hidden, setHidden] = useState(false)
  const raised = Math.max(0, Math.min(committed, RAISE_TOTAL))
  const pct = (raised / RAISE_TOTAL) * 100
  const nextTier = RAISE_TIERS.find((t) => raised < t.amount)

  if (hidden) return null

  function goToContact() {
    window.dispatchEvent(new Event(PARTNERSHIP_INTENT_EVENT))
    logLeadEvent('funding_request', {
      detail: nextTier
        ? `Clicked the sticky raise bar (next: ${nextTier.label})`
        : 'Clicked the sticky raise bar',
    })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold-500/30 bg-ink-950/95 backdrop-blur">
      {/* Full-bleed progress track across the whole screen */}
      <div className="relative h-1.5 w-full bg-ink-800">
        <div
          className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
        {RAISE_TIERS.map((tier) => (
          <span
            key={tier.amount}
            className={`absolute top-0 h-full w-px ${
              raised >= tier.amount ? 'bg-ink-950/50' : 'bg-ink-600'
            }`}
            style={{ left: `${(tier.amount / RAISE_TOTAL) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Roomier on desktop; stays compact on phones. */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-6 sm:py-[1.6rem]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white sm:text-lg">
            <span className="text-gold-400">{formatCompactCurrency(raised)}</span> of{' '}
            {formatCompactCurrency(RAISE_TOTAL)} raised
            <span className="hidden text-ink-400 sm:inline"> · {Math.round(pct)}%</span>
          </p>
          <p className="truncate text-xs text-ink-400 sm:mt-1 sm:text-sm">
            {nextTier
              ? `${formatCurrency(nextTier.amount - raised)} more starts ${nextTier.label}`
              : 'Fully funded — every property is running'}
          </p>
        </div>

        <button
          onClick={goToContact}
          className="shrink-0 whitespace-nowrap rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-3.5 py-2 text-xs font-semibold text-ink-950 transition-transform hover:scale-[1.03] sm:px-6 sm:py-3 sm:text-base cursor-pointer"
        >
          Fund a milestone
        </button>

        <button
          onClick={() => setHidden(true)}
          aria-label="Hide raise bar"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
