import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Deal } from '../lib/types'
import { formatCurrency, formatCompactCurrency, formatDate } from '../lib/format'
import { publicLocation, CONTACT_PHONE, CONTACT_PHONE_HREF, SITE_NAME } from '../lib/site'
import { getMediaUrl } from '../lib/storage'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import Spinner from '../components/Spinner'

export default function TrackRecord() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'completed')
        .order('sold_date', { ascending: false, nullsFirst: false })
      if (!cancelled) {
        setDeals((data ?? []) as Deal[])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Spinner full />

  const sold = deals.filter((d) => d.sold_price !== null)
  const totalSold = sold.reduce((s, d) => s + (d.sold_price ?? 0), 0)
  const totalRehab = deals.reduce((s, d) => s + (d.rehab_spent ?? 0), 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="animate-fade-up mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-500">
          {SITE_NAME} · Track Record
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Projects we've <span className="text-gradient-animated">finished and sold</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-400">
          Every completed flip, with what we paid, what we put in, and what it sold for. Our lenders
          have been paid in full on every project to date.
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-16 text-center">
          <p className="text-lg font-medium text-white">First flips are in progress</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-400">
            Completed projects land here with full numbers — purchase, rehab, sale price, and how our
            lenders were paid. In the meantime, watch the active portfolio update live.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-brand-400"
            >
              See active deals
            </Link>
            <a
              href={CONTACT_PHONE_HREF}
              className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 hover:border-ink-400 hover:text-white"
            >
              Call {CONTACT_PHONE}
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-center">
              <p className="text-xl font-semibold text-white">{deals.length}</p>
              <p className="mt-0.5 text-xs text-ink-500">Projects completed</p>
            </div>
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-center">
              <p className="text-xl font-semibold text-white">{formatCompactCurrency(totalSold)}</p>
              <p className="mt-0.5 text-xs text-ink-500">Total sold volume</p>
            </div>
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-3 text-center">
              <p className="text-xl font-semibold text-brand-400">{formatCompactCurrency(totalRehab)}</p>
              <p className="mt-0.5 text-xs text-ink-500">Rehab invested</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {deals.map((deal) => {
              const location = publicLocation(deal.property_address)
              const allIn = (deal.purchase_price ?? 0) + (deal.rehab_spent ?? 0)
              const gross =
                deal.sold_price !== null && allIn > 0 ? deal.sold_price - allIn : null
              return (
                <article
                  key={deal.id}
                  className="animate-fade-up overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900/40"
                >
                  {deal.before_image_path && deal.after_image_path ? (
                    <BeforeAfterSlider
                      beforeUrl={getMediaUrl(deal.before_image_path)}
                      afterUrl={getMediaUrl(deal.after_image_path)}
                      alt={deal.title}
                    />
                  ) : deal.cover_image_path ? (
                    <img
                      src={getMediaUrl(deal.cover_image_path)}
                      alt={deal.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : null}

                  <div className="p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{deal.title}</h2>
                        {location && <p className="text-sm text-ink-400">{location}</p>}
                      </div>
                      {deal.sold_date && (
                        <span className="rounded-full bg-ink-800 px-2.5 py-1 text-xs text-ink-300">
                          Sold {formatDate(deal.sold_date)}
                        </span>
                      )}
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-ink-800/50 px-3 py-2.5">
                        <dt className="text-xs text-ink-500">Purchased</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {formatCurrency(deal.purchase_price)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-ink-800/50 px-3 py-2.5">
                        <dt className="text-xs text-ink-500">Rehab</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {formatCurrency(deal.rehab_spent)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-ink-800/50 px-3 py-2.5">
                        <dt className="text-xs text-ink-500">Sold for</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-white">
                          {formatCurrency(deal.sold_price)}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2.5">
                        <dt className="text-xs text-ink-500">Gross spread</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-brand-400">
                          {gross === null ? '—' : formatCurrency(gross)}
                        </dd>
                      </div>
                    </dl>

                    {deal.lender_outcome && (
                      <p className="mt-3 flex items-start gap-2 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3.5 py-2.5 text-sm text-ink-200">
                        <span aria-hidden="true">🤝</span>
                        <span>{deal.lender_outcome}</span>
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <div className="mt-10 rounded-2xl border border-ink-700/60 bg-gradient-to-b from-ink-900/80 to-ink-950 px-6 py-8 text-center">
        <h2 className="text-xl font-semibold text-white">Want to be on the next one?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-400">
          Second-position liens, deals bought below 70% LTARV, and a portfolio you can watch move in
          real time.
        </p>
        <a
          href={CONTACT_PHONE_HREF}
          className="mt-5 inline-block rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02]"
        >
          Talk deals — call {CONTACT_PHONE}
        </a>
      </div>
    </div>
  )
}
