import type { Deal } from '../lib/types'
import { formatCurrency } from '../lib/format'

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
  const equity = deal.arv !== null && deal.lien_amount !== null ? deal.arv - deal.lien_amount : null
  const hasBudget = deal.rehab_budget !== null && deal.rehab_budget > 0
  const spent = deal.rehab_spent ?? 0
  const budgetPct = hasBudget ? Math.round((spent / deal.rehab_budget!) * 100) : null
  const overBudget = budgetPct !== null && budgetPct > 100

  if (deal.arv === null && deal.lien_amount === null && !hasBudget) return null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Lien (incl. rehab)" value={formatCurrency(deal.lien_amount)} />
      <Tile label="ARV" value={formatCurrency(deal.arv)} />
      <Tile
        label="Projected equity"
        value={equity === null ? '—' : formatCurrency(equity)}
        accent={equity !== null && equity > 0}
      />
      <Tile
        label="Rehab budget used"
        value={hasBudget ? `${formatCurrency(spent)} / ${formatCurrency(deal.rehab_budget)}` : '—'}
      >
        {budgetPct !== null && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
              <div
                className={`h-full rounded-full transition-all ${
                  overBudget ? 'bg-alert-500' : 'bg-gradient-to-r from-brand-500 to-brand-400'
                }`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <p className={`mt-1 text-xs ${overBudget ? 'font-medium text-alert-400' : 'text-ink-500'}`}>
              {budgetPct}% used{overBudget ? ' — over budget' : ''}
            </p>
          </div>
        )}
      </Tile>
    </div>
  )
}
