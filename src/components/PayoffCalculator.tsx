import { useState } from 'react'
import { formatCurrency } from '../lib/format'
import { PARTNER_MINIMUM } from '../lib/site'

const DEFAULT_RATE = 12
const DEFAULT_MONTHS = 6

// Lets an investor size their own return on this deal, then carries the number
// straight into the inquiry form.
export default function PayoffCalculator({
  raiseTarget,
  onCta,
}: {
  raiseTarget: number | null
  onCta: (amount: number) => void
}) {
  const cap = raiseTarget && raiseTarget > 0 ? raiseTarget : 100000
  const [amount, setAmount] = useState(Math.min(20000, cap))
  const [months, setMonths] = useState(DEFAULT_MONTHS)

  const interest = Math.round((amount * (DEFAULT_RATE / 100) * months) / 12)
  const total = amount + interest

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">What a partnership could look like</h3>
        <span className="text-xs text-ink-500">{DEFAULT_RATE}% annualized</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="flex items-baseline justify-between text-xs font-medium text-ink-400">
            You lend
            <span className="text-sm font-semibold text-white tabular-nums">{formatCurrency(amount)}</span>
          </label>
          <input
            type="range"
            min={5000}
            max={cap}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Amount you lend"
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--color-brand-400) ${
                ((amount - 5000) / Math.max(cap - 5000, 1)) * 100
              }%, var(--color-ink-700) ${((amount - 5000) / Math.max(cap - 5000, 1)) * 100}%)`,
              accentColor: 'var(--color-brand-400)',
            }}
          />
        </div>

        <div>
          <label className="flex items-baseline justify-between text-xs font-medium text-ink-400">
            Held for
            <span className="text-sm font-semibold text-white tabular-nums">
              {months} month{months > 1 ? 's' : ''}
            </span>
          </label>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            aria-label="Months held"
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, var(--color-brand-400) ${
                ((months - 3) / 9) * 100
              }%, var(--color-ink-700) ${((months - 3) / 9) * 100}%)`,
              accentColor: 'var(--color-brand-400)',
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-ink-800/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(amount)}</p>
          <p className="mt-0.5 text-xs text-ink-500">Principal</p>
        </div>
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2.5">
          <p className="text-sm font-semibold text-brand-400 tabular-nums">+{formatCurrency(interest)}</p>
          <p className="mt-0.5 text-xs text-ink-500">Your return</p>
        </div>
        <div className="rounded-lg bg-ink-800/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-white tabular-nums">{formatCurrency(total)}</p>
          <p className="mt-0.5 text-xs text-ink-500">Paid at close</p>
        </div>
      </div>

      <button
        onClick={() => onCta(amount)}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        Partner at {formatCurrency(amount)}
      </button>

      <p className="mt-2.5 text-center text-xs leading-relaxed text-ink-500">
        Illustration only, not an offer or a guarantee — actual terms are agreed in writing per deal.
        Partnerships start at {PARTNER_MINIMUM}.
      </p>
    </div>
  )
}
