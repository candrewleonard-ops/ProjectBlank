import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Deal, TaskStatus } from '../lib/types'
import DealCard from '../components/DealCard'
import Spinner from '../components/Spinner'
import PartnerPromo from '../components/PartnerPromo'
import EmailCapture from '../components/EmailCapture'
import { CONTACT_PHONE, CONTACT_PHONE_HREF, FACEBOOK_PAGE_URL, SELLING_COST_RATE, SITE_NAME } from '../lib/site'
import { formatCompactCurrency } from '../lib/format'

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
      className={`animate-fade-up rounded-xl border px-4 py-3 text-center ${
        accent ? 'border-brand-500/30 bg-brand-500/5' : 'border-ink-700/60 bg-ink-900/40'
      }`}
    >
      <p className={`text-xl font-semibold ${accent ? 'text-brand-400' : 'text-white'}`}>
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

export default function Dashboard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [counts, setCounts] = useState<Record<string, Counts>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: dealRows, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false })

      if (dealsError) {
        if (!cancelled) {
          setError(dealsError.message)
          setLoading(false)
        }
        return
      }

      const dealList = (dealRows ?? []) as Deal[]
      if (cancelled) return
      setDeals(dealList)

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
        if (!cancelled) setCounts(tally)
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Spinner full />

  const regular = deals.filter((d) => !d.is_partnered)
  const partnered = deals.filter((d) => d.is_partnered)
  const active = deals.filter((d) => d.status === 'active')
  const portfolioArv = active.reduce((sum, d) => sum + (d.arv ?? 0), 0)
  const portfolioCash = active.reduce((sum, d) => {
    if (d.arv === null || d.lien_amount === null) return sum
    return sum + (d.arv - d.lien_amount - Math.round(d.arv * SELLING_COST_RATE))
  }, 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PartnerPromo />
      <div className="animate-fade-up mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-500">
          {SITE_NAME} · Investor Portal
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Real houses. Real numbers.{' '}
          <span className="text-gradient-animated">Watched live.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-400">
          Every project below is a real property we're buying, renovating, and selling — with
          budgets, milestones, and photos updated as the work happens.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href={CONTACT_PHONE_HREF}
            className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/25 transition-transform hover:scale-[1.03] active:scale-[0.99]"
          >
            Partner with us — {CONTACT_PHONE}
          </a>
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
        <div className="mb-8 grid grid-cols-3 gap-3">
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {regular.map((deal, i) => (
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
            <h2 className="text-xl font-semibold tracking-tight text-white">🤝 Partnered Projects</h2>
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

      <EmailCapture />
    </div>
  )
}
