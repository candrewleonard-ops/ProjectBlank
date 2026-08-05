import type { Deal } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { RESERVE_MONTHS, MONTHLY_PAYMENT_RATE, REHAB_RESERVE_RATE } from '../lib/site'

export default function ReservesStrip({ deal }: { deal: Deal }) {
  const paymentReserve =
    deal.lien_amount !== null
      ? Math.round(deal.lien_amount * MONTHLY_PAYMENT_RATE * RESERVE_MONTHS)
      : null
  const rehabReserve =
    deal.rehab_budget !== null ? Math.round(deal.rehab_budget * REHAB_RESERVE_RATE) : null
  const total =
    paymentReserve !== null || rehabReserve !== null
      ? (paymentReserve ?? 0) + (rehabReserve ?? 0)
      : null

  if (total === null) return null

  return (
    <div className="rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-500/15 text-base">
            🏦
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              Cash reserves needed: <span className="text-gold-400">{formatCurrency(total)}</span>
            </p>
            <p className="text-xs text-ink-400">
              Our reserve target on every deal — so payments and work never stall.
            </p>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          {paymentReserve !== null && (
            <span className="rounded-lg bg-ink-900/60 px-3 py-1.5 text-ink-300">
              Payment reserves ({RESERVE_MONTHS} mo)
              <span className="ml-1.5 font-semibold text-white">{formatCurrency(paymentReserve)}</span>
            </span>
          )}
          {rehabReserve !== null && (
            <span className="rounded-lg bg-ink-900/60 px-3 py-1.5 text-ink-300">
              Rehab reserves ({Math.round(REHAB_RESERVE_RATE * 100)}%)
              <span className="ml-1.5 font-semibold text-white">{formatCurrency(rehabReserve)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
