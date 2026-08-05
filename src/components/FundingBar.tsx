import type { Deal } from '../lib/types'
import { formatCurrency, formatCompactCurrency } from '../lib/format'

export default function FundingBar({ deal, compact }: { deal: Deal; compact?: boolean }) {
  if (deal.raise_target === null || deal.raise_target <= 0 || deal.status !== 'active') return null

  const committed = Math.min(deal.raise_committed, deal.raise_target)
  const pct = Math.round((committed / deal.raise_target) * 100)
  const remaining = deal.raise_target - committed
  const full = remaining <= 0

  if (compact) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-gold-400">
            {full ? '🎉 Fully funded' : `Raising ${formatCompactCurrency(deal.raise_target)}`}
          </span>
          <span className="text-ink-400">
            {formatCompactCurrency(committed)} committed · {pct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-700"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gold-500/30 bg-gradient-to-r from-gold-500/10 to-transparent px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">
          {full ? (
            <>🎉 Fully funded — thank you</>
          ) : (
            <>
              Now raising <span className="text-gold-400">{formatCurrency(deal.raise_target)}</span> on
              this deal
            </>
          )}
        </p>
        <p className="text-xs text-ink-400">
          {formatCurrency(committed)} committed
          {!full && <> · {formatCurrency(remaining)} remaining</>}
        </p>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-700"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-500">{pct}% committed — funded in order of commitment</p>
    </div>
  )
}
