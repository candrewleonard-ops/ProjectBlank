import type { Deal } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { publicLocation, ADDRESS_ON_REQUEST, CONTACT_PHONE, CONTACT_PHONE_HREF } from '../lib/site'
import DocumentList from './DocumentList'

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-900/40 px-3.5 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-100">{value === null || value === '' ? '—' : value}</dd>
    </div>
  )
}

export default function DealInfoTab({ deal }: { deal: Deal }) {
  const budgetDiff =
    deal.rehab_budget !== null && deal.rehab_spent !== null ? deal.rehab_spent - deal.rehab_budget : null
  const location = publicLocation(deal.property_address)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Property details</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Location" value={location} />
          <Field label="Year built" value={deal.year_built} />
          <Field label="Exterior" value={deal.exterior_type} />
          <Field label="ARV (after-repair value)" value={formatCurrency(deal.arv)} />
        </dl>
        <div className="mt-3 rounded-lg border border-brand-500/30 bg-brand-500/5 px-3.5 py-3">
          <p className="text-sm text-ink-200">
            {ADDRESS_ON_REQUEST} — call{' '}
            <a
              href={CONTACT_PHONE_HREF}
              className="font-semibold text-brand-400 transition-colors hover:text-brand-300"
            >
              {CONTACT_PHONE}
            </a>
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Financing & rehab budget</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Total lien (incl. rehab)" value={formatCurrency(deal.lien_amount)} />
          <Field
            label="Purchase lien"
            value={
              deal.lien_amount !== null
                ? formatCurrency(deal.lien_amount - (deal.rehab_budget ?? 0))
                : null
            }
          />
          <Field label="Rehab lien (budget)" value={formatCurrency(deal.rehab_budget)} />
          <Field label="Rehab drawn to date" value={formatCurrency(deal.rehab_spent)} />
          <Field
            label="Undrawn rehab funds"
            value={
              deal.rehab_budget !== null
                ? formatCurrency(Math.max(deal.rehab_budget - (deal.rehab_spent ?? 0), 0))
                : null
            }
          />
          <Field
            label="Budget variance"
            value={
              budgetDiff === null
                ? null
                : budgetDiff === 0
                  ? 'On budget'
                  : budgetDiff < 0
                    ? `${formatCurrency(Math.abs(budgetDiff))} under budget`
                    : `${formatCurrency(budgetDiff)} over budget`
            }
          />
        </dl>
        {deal.budget_variance_note && (
          <p className="mt-3 rounded-lg border border-ink-700/60 bg-ink-900/40 px-3.5 py-3 text-sm text-ink-300">
            {deal.budget_variance_note}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Documents</h3>
        <DocumentList dealId={deal.id} docType="pdf" />
      </div>
    </div>
  )
}
