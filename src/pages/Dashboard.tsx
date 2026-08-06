import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Deal, TaskStatus } from '../lib/types'
import DealCard from '../components/DealCard'
import Spinner from '../components/Spinner'
import PartnerPromo from '../components/PartnerPromo'
import EmailCapture from '../components/EmailCapture'
import ContactCta from '../components/ContactCta'
import PortfolioRaiseBar from '../components/PortfolioRaiseBar'
import { FACEBOOK_PAGE_URL, SELLING_COST_RATE, SITE_NAME } from '../lib/site'
import { formatCompactCurrency, formatRelativeTime } from '../lib/format'

const REFRESH_MS = 60_000

// Eases a number from 0 to its target for the count-up stat tiles.
function useCountUp(target: number, duration = 1300): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let raf: number
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      setValue(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function StatTile({
  value,
  label,
  format,
  accent,
}: {
  value: number
  label: string
  format: (n: number) => string
  accent?: boolean
}) {
  const animated = useCountUp(value)
  return (
    <div
      className={`animate-fade-up rounded-xl border px-3 py-3 text-center ${
        accent ? 'border-brand-500/30 bg-brand-500/5' : 'border-ink-700/60 bg-ink-900/40'
      }`}
    >
      <p className={`text-lg font-semibold sm:text-xl ${accent ? 'text-brand-400' : 'text-white'}`}>
        {format(animated)}
      </p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  )
}

interface Counts {
  todo: number
  complete: number
  red_alert: number
}

type Filter = 'all' | 'ltarv70' | 'rehab' | 'alert'
type Sort = 'newest' | 'arv' | 'ltarv'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ltarv70', label: 'Below 70% LTARV' },
  { id: 'rehab', label: 'Rehab in progress' },
  { id: 'alert', label: 'Red alerts' },
]

function ltarvOf(deal: Deal): number | null {
  return deal.arv !== null && deal.arv > 0 && deal.lien_amount !== null
    ? (deal.lien_amount / deal.arv) * 100
    : null
}

export default function Dashboard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [counts, setCounts] = useState<Record<string, Counts>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [raiseCommitted, setRaiseCommitted] = useState(0)

  const load = useCallback(async (initial: boolean) => {
    if (initial) setLoading(true)
    setError(null)

    const { data: dealRows, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (dealsError) {
      if (initial) {
        setError(dealsError.message)
        setLoading(false)
      }
      return
    }

    const dealList = (dealRows ?? []) as Deal[]
    setDeals(dealList)

    const { data: settings } = await supabase
      .from('site_settings')
      .select('raise_committed')
      .maybeSingle()
    if (settings) setRaiseCommitted(Number(settings.raise_committed) || 0)

    if (dealList.length > 0) {
      const { data: taskRows } = await supabase
        .from('deal_tasks')
        .select('deal_id, status')
        .in('deal_id', dealList.map((d) => d.id))

      const tally: Record<string, Counts> = {}
      for (const row of (taskRows ?? []) as { deal_id: string; status: TaskStatus }[]) {
        if (!tally[row.deal_id]) tally[row.deal_id] = { todo: 0, complete: 0, red_alert: 0 }
        tally[row.deal_id][row.status]++
      }
      setCounts(tally)
    }

    if (initial) setLoading(false)
  }, [])

  useEffect(() => {
    load(true)
    // Quiet background refresh so the numbers stay live while the tab is open.
    const t = setInterval(() => {
      if (!document.hidden) load(false)
    }, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const asOf = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()),
    [],
  )

  if (loading) return <Spinner full />

  const regular = deals.filter((d) => !d.is_partnered)
  const partnered = deals.filter((d) => d.is_partnered)
  const active = deals.filter((d) => d.status === 'active')

  const portfolioArv = active.reduce((sum, d) => sum + (d.arv ?? 0), 0)
  const portfolioCash = active.reduce((sum, d) => {
    if (d.arv === null || d.lien_amount === null) return sum
    return sum + (d.arv - d.lien_amount - Math.round(d.arv * SELLING_COST_RATE))
  }, 0)
  const withBoth = active.filter((d) => d.arv !== null && d.arv > 0 && d.lien_amount !== null)
  const avgLtarv =
    withBoth.length > 0
      ? (withBoth.reduce((s, d) => s + d.lien_amount!, 0) / withBoth.reduce((s, d) => s + d.arv!, 0)) * 100
      : 0
  const rehabDeployed = active.reduce((sum, d) => sum + (d.rehab_spent ?? 0), 0)
  const lastUpdated =
    deals.length > 0 ? deals.reduce((m, d) => (d.updated_at > m ? d.updated_at : m), deals[0].updated_at) : null

  function applyFilter(list: Deal[]): Deal[] {
    let out = list
    if (filter === 'ltarv70') out = list.filter((d) => (ltarvOf(d) ?? 999) <= 70)
    if (filter === 'rehab')
      out = list.filter((d) => d.rehab_budget !== null && d.rehab_budget > 0 && (d.rehab_spent ?? 0) < d.rehab_budget)
    if (filter === 'alert')
      out = list.filter((d) => d.is_illiquid || (counts[d.id]?.red_alert ?? 0) > 0)

    if (sort === 'arv') out = [...out].sort((a, b) => (b.arv ?? -1) - (a.arv ?? -1))
    if (sort === 'ltarv') out = [...out].sort((a, b) => (ltarvOf(a) ?? 999) - (ltarvOf(b) ?? 999))
    return out
  }

  const shownRegular = applyFilter(regular)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PartnerPromo />

      <div className="animate-fade-up mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-500">
          {SITE_NAME} · Investor Portal
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
          ZGH Holdings Flip Portfolio{' '}
          <span className="block text-xl font-semibold text-ink-300 sm:mt-1 sm:text-2xl">
            as of {asOf} — <span className="text-gradient-animated">Updated Live</span>
          </span>
        </h1>

        {lastUpdated && (
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-ink-700/60 bg-ink-900/60 px-3 py-1 text-xs text-ink-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
            </span>
            Live — last project update {formatRelativeTime(lastUpdated)}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/25 transition-transform hover:scale-[1.03] active:scale-[0.99] cursor-pointer"
          >
            Partner with us
          </button>
          <a
            href={FACEBOOK_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-ink-600 px-5 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
          >
            Follow us on Facebook
          </a>
        </div>
      </div>

      {active.length > 0 && (portfolioArv > 0 || portfolioCash > 0) && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            value={active.length}
            label={`Active project${active.length > 1 ? 's' : ''}`}
            format={(n) => Math.round(n).toString()}
          />
          <StatTile value={portfolioArv} label="Portfolio ARV" format={formatCompactCurrency} />
          <StatTile
            value={portfolioCash}
            label="Projected cash at close"
            format={formatCompactCurrency}
            accent
          />
          <StatTile value={avgLtarv} label="Avg LTARV" format={(n) => `${Math.round(n)}%`} />
          <StatTile value={rehabDeployed} label="Rehab deployed" format={formatCompactCurrency} />
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          {error}
        </p>
      )}

      {!error && deals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-700 py-16 text-center text-ink-500">
          No deals published yet. Check back soon.
        </div>
      )}

      {regular.length > 0 && (
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto rounded-lg bg-ink-900/60 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filter === f.id ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs text-white outline-none focus:border-brand-500"
          >
            <option value="newest">Newest first</option>
            <option value="arv">Highest ARV</option>
            <option value="ltarv">Lowest LTARV</option>
          </select>
        </div>
      )}

      {regular.length > 0 && shownRegular.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-700 py-10 text-center text-sm text-ink-500">
          No deals match that filter right now.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shownRegular.map((deal, i) => (
          <div key={deal.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
            <DealCard
              deal={deal}
              eager={i === 0}
              counts={counts[deal.id] ?? { todo: 0, complete: 0, red_alert: 0 }}
            />
          </div>
        ))}
      </div>

      {partnered.length > 0 && (
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              🤝 Partnered Projects
              <span className="ml-2 align-middle text-sm font-normal text-ink-500">{partnered.length}</span>
            </h2>
            <p className="mt-1 text-sm text-ink-400">
              Deals we run alongside partner investors — same live transparency, shared upside.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partnered.map((deal, i) => (
              <div key={deal.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                <DealCard
                  deal={deal}
                  counts={counts[deal.id] ?? { todo: 0, complete: 0, red_alert: 0 }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <PortfolioRaiseBar committed={raiseCommitted} />
      <ContactCta />
      <EmailCapture />
    </div>
  )
}
