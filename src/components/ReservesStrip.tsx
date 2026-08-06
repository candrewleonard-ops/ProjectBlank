import type { Deal } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { REHAB_RESERVE_RATE, PAYMENTS_FUNDED_LABEL, PAYMENTS_FUNDED_NOTE } from '../lib/site'

export default function ReservesStrip({ deal }: { deal: Deal }) {
  const rehabReserve =
    deal.rehab_budget !== null ? Math.round(deal.rehab_budget * REHAB_RESERVE_RATE) : null

  if (rehabReserve === null) return null

  return (
    <div className="rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-500/15 text-base">
            🏦
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              Rehab cash reserves needed:{' '}
              <span className="text-gold-400">{formatCurrency(rehabReserve)}</span>
            </p>
            <p className="text-xs text-ink-400">
              {Math.round(REHAB_RESERVE_RATE * 100)}% of the rehab budget held in cash so work never
              stalls.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 border-t border-gold-500/15 pt-3">
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-brand-500 text-[11px] font-bold text-ink-950"
        >
          ✓
        </span>
        <p className="text-sm text-ink-200">
          <span className="font-semibold text-white">{PAYMENTS_FUNDED_LABEL}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">
            {PAYMENTS_FUNDED_NOTE}
          </span>
        </p>
      </div>
    </div>
  )
}
