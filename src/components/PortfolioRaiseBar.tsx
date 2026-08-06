import { formatCurrency } from '../lib/format'
import { RAISE_TOTAL, RAISE_TIERS } from '../lib/site'
import { PARTNERSHIP_INTENT_EVENT } from './ContactCta'
import { logLeadEvent } from '../lib/leads'

// Portfolio-wide raise, docked at the bottom of the deals page. Each tier
// unlocks another property's rehab reserve as capital comes in.
export default function PortfolioRaiseBar({ committed }: { committed: number }) {
  const raised = Math.max(0, Math.min(committed, RAISE_TOTAL))
  const pct = (raised / RAISE_TOTAL) * 100
  const nextTier = RAISE_TIERS.find((t) => raised < t.amount)

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-b from-ink-900 to-ink-950">
      <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500" />

      <div className="px-4 py-7 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
            Open capital raise
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {formatCurrency(raised)}{' '}
            <span className="text-ink-400">of {formatCurrency(RAISE_TOTAL)}</span>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-400">
            Every dollar funds the rehab cash reserves that put another property to work. Here's
            exactly what each milestone unlocks.
          </p>
        </div>

        {/* Track with milestone markers */}
        <div className="relative mx-auto mt-8 max-w-3xl">
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-inset ring-ink-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Tick marks sitting on the track */}
          {RAISE_TIERS.map((tier) => {
            const left = (tier.amount / RAISE_TOTAL) * 100
            const reached = raised >= tier.amount
            return (
              <span
                key={tier.amount}
                className={`absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  reached ? 'bg-ink-950/60' : 'bg-ink-600'
                }`}
                style={{ left: `${left}%` }}
                aria-hidden="true"
              />
            )
          })}
        </div>

        {/* Milestone list */}
        <ol className="mx-auto mt-6 flex max-w-3xl flex-col gap-2">
          {RAISE_TIERS.map((tier) => {
            const reached = raised >= tier.amount
            const isNext = nextTier?.amount === tier.amount
            return (
              <li
                key={tier.amount}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                  reached
                    ? 'border-gold-500/40 bg-gold-500/10'
                    : isNext
                      ? 'border-brand-500/30 bg-brand-500/5'
                      : 'border-ink-700/60 bg-ink-900/40'
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    reached ? 'bg-gold-400 text-ink-950' : 'bg-ink-800 text-ink-400'
                  }`}
                  aria-hidden="true"
                >
                  {reached ? '✓' : '•'}
                </span>

                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${reached ? 'text-white' : 'text-ink-200'}`}>
                    {tier.label}
                  </span>
                  <span className="block text-xs text-ink-400">
                    {reached ? `Funded — ${tier.note.toLowerCase()}` : tier.note}
                  </span>
                </span>

                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    reached ? 'bg-gold-500/20 text-gold-300' : 'bg-ink-800 text-ink-300'
                  }`}
                >
                  {formatCurrency(tier.amount)}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="mt-6 text-center">
          {nextTier ? (
            <p className="text-sm text-ink-300">
              <span className="font-semibold text-gold-400">
                {formatCurrency(nextTier.amount - raised)}
              </span>{' '}
              more starts <span className="font-semibold text-white">{nextTier.label}</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-gold-400">
              🎉 Fully funded — every property is running
            </p>
          )}
          <button
            onClick={() => {
              window.dispatchEvent(new Event(PARTNERSHIP_INTENT_EVENT))
              logLeadEvent('funding_request', {
                detail: nextTier
                  ? `Clicked Fund a milestone (next: ${nextTier.label})`
                  : 'Clicked Fund a milestone',
              })
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="mt-4 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-gold-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            Fund a milestone
          </button>
        </div>
      </div>
    </section>
  )
}
