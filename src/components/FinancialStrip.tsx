import type { Deal } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { SELLING_COST_RATE } from '../lib/site'

function Tile({
  label,
  value,
  accent,
  children,
}: {
  label: string
  value: string
  accent?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent ? 'border-brand-500/40 bg-brand-500/10' : 'border-ink-700/60 bg-ink-900/40'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? 'text-brand-400' : 'text-white'}`}>{value}</p>
      {children}
    </div>
  )
}

export default function FinancialStrip({ deal }: { deal: Deal }) {
  const lien = deal.lien_amount
  const budget = deal.rehab_budget
  const spent = deal.rehab_spent ?? 0

  // Lien splits into the purchase side and the rehab side; the rehab side is
  // drawn down as work gets paid for.
  const purchaseLien = lien !== null ? (budget !== null ? lien - budget : lien) : null
  const hasBudget = budget !== null && budget > 0
  const drawn = hasBudget ? Math.min(spent, budget) : null
  const undrawn = hasBudget ? Math.max(budget - spent, 0) : null
  const drawnPct = hasBudget ? Math.round((spent / budget) * 100) : null
  const overBudget = drawnPct !== null && drawnPct > 100

  const sellingCosts = deal.arv !== null ? Math.round(deal.arv * SELLING_COST_RATE) : null
  const cashAtClose =
    deal.arv !== null && lien !== null && sellingCosts !== null ? deal.arv - lien - sellingCosts : null

  const ltarv = deal.arv !== null && deal.arv > 0 && lien !== null ? Math.round((lien / deal.arv) * 100) : null

  if (deal.arv === null && lien === null && !hasBudget) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Tile label="Purchase lien" value={formatCurrency(purchaseLien)}>
        {lien !== null && hasBudget && (
          <p className="mt-1 text-xs text-ink-500">of {formatCurrency(lien)} total lien</p>
        )}
      </Tile>

      <Tile label="Rehab lien" value={hasBudget ? formatCurrency(budget) : '—'}>
        {hasBudget && (
          <div className="mt-2">
            <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-ink-700">
              <div
                className={`h-full ${overBudget ? 'bg-alert-500' : 'bg-gradient-to-r from-brand-500 to-brand-400'}`}
                style={{ width: `${Math.min(drawnPct!, 100)}%` }}
              />
            </div>
            <p className={`mt-1 text-xs ${overBudget ? 'font-medium text-alert-400' : 'text-ink-500'}`}>
              {overBudget
                ? `Drawn ${formatCurrency(spent)} — over budget`
                : `Drawn ${formatCurrency(drawn)} · Undrawn ${formatCurrency(undrawn)}`}
            </p>
          </div>
        )}
      </Tile>

      <Tile label="ARV" value={formatCurrency(deal.arv)}>
        {ltarv !== null && (
          <span
            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              ltarv <= 70 ? 'bg-brand-500/15 text-brand-400' : 'bg-ink-800 text-ink-300'
            }`}
          >
            LTARV {ltarv}%
          </span>
        )}
      </Tile>

      <Tile
        label="Realtor fees, interest payments & closing costs due"
        value={sellingCosts === null ? '—' : formatCurrency(sellingCosts)}
      >
        <p className="mt-1 text-xs text-ink-500">{(SELLING_COST_RATE * 100).toFixed(1)}% of ARV</p>
      </Tile>

      <Tile
        label="Projected cash at close"
        value={cashAtClose === null ? '—' : formatCurrency(cashAtClose)}
        accent={cashAtClose !== null && cashAtClose > 0}
      />
    </div>
  )
}
