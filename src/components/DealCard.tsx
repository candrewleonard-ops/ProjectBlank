import { Link } from 'react-router-dom'
import type { Deal } from '../lib/types'
import { getMediaUrl } from '../lib/storage'
import { publicLocation, SELLING_COST_RATE } from '../lib/site'
import { formatCompactCurrency } from '../lib/format'

interface TaskCounts {
  todo: number
  complete: number
  red_alert: number
}

export default function DealCard({
  deal,
  counts,
  eager,
}: {
  deal: Deal
  counts: TaskCounts
  eager?: boolean
}) {
  const total = counts.todo + counts.complete + counts.red_alert
  const pct = total > 0 ? Math.round((counts.complete / total) * 100) : 0
  const location = publicLocation(deal.property_address)
  const equity =
    deal.arv !== null && deal.lien_amount !== null
      ? deal.arv - deal.lien_amount - Math.round(deal.arv * SELLING_COST_RATE)
      : null
  const ltarv =
    deal.arv !== null && deal.arv > 0 && deal.lien_amount !== null
      ? Math.round((deal.lien_amount / deal.arv) * 100)
      : null

  return (
    <Link
      to={`/deals/${deal.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900/50 transition-all hover:-translate-y-0.5 hover:border-ink-500 hover:shadow-xl hover:shadow-black/30"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-800">
        {deal.cover_image_path ? (
          <img
            src={getMediaUrl(deal.cover_image_path)}
            alt={deal.title}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-600">
            <span className="text-3xl">🏠</span>
          </div>
        )}

        {deal.is_illiquid && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-alert-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Red alert
          </span>
        )}
        {deal.status !== 'active' && (
          <span className="absolute right-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-xs font-medium capitalize text-ink-200 backdrop-blur">
            {deal.status}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">{deal.title}</h3>
          {location && <p className="mt-0.5 text-sm text-ink-400">{location}</p>}
        </div>

        {(total > 0 || deal.current_focus) && (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              {deal.current_focus ? (
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-brand-400">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-400" />
                  <span className="truncate">Now: {deal.current_focus}</span>
                </span>
              ) : (
                <span className="text-ink-400">{counts.complete} of {total} tasks complete</span>
              )}
              {total > 0 && <span className="shrink-0 text-ink-400">{pct}%</span>}
            </div>
            {total > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            {counts.red_alert > 0 && (
              <p className="mt-1.5 text-xs font-medium text-alert-400">
                {counts.red_alert} item{counts.red_alert > 1 ? 's' : ''} flagged
              </p>
            )}
          </div>
        )}

        {(deal.arv !== null || equity !== null || deal.is_partnered) && (
          <div className="mt-auto flex gap-2 border-t border-ink-700/60 pt-3 text-xs">
            {deal.arv !== null && (
              <span className="rounded-md bg-ink-800 px-2 py-1 text-ink-300">
                ARV <span className="font-semibold text-white">{formatCompactCurrency(deal.arv)}</span>
              </span>
            )}
            {equity !== null && equity > 0 && (
              <span className="rounded-md bg-brand-500/10 px-2 py-1 text-brand-400">
                Cash at close <span className="font-semibold">{formatCompactCurrency(equity)}</span>
              </span>
            )}
            {deal.is_partnered && (
              <span className="rounded-md bg-gold-500/10 px-2 py-1 text-gold-400">🤝 Partnered</span>
            )}
            {ltarv !== null && ltarv <= 70 && (
              <span className="rounded-md bg-ink-800 px-2 py-1 text-ink-300">
                LTARV <span className="font-semibold text-white">{ltarv}%</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
