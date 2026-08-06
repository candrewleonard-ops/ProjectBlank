import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Deal, DealInquiry } from '../lib/types'
import { getMediaUrl } from '../lib/storage'
import { formatDate } from '../lib/format'
import Spinner from '../components/Spinner'
import MoneySlider from '../components/admin/MoneySlider'
import { RAISE_TOTAL, RAISE_TIERS } from '../lib/site'
import { formatCurrency } from '../lib/format'

type InquiryWithDeal = DealInquiry & { deals: { title: string; slug: string } | null }

export default function AdminDashboard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [inquiries, setInquiries] = useState<InquiryWithDeal[]>([])
  const [inquiriesError, setInquiriesError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [raise, setRaise] = useState(0)
  const [raiseSaved, setRaiseSaved] = useState<number | null>(null)
  const [raiseError, setRaiseError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data }, inquiriesResult] = await Promise.all([
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase
        .from('deal_inquiries')
        .select('*, deals(title, slug)')
        .order('created_at', { ascending: false })
        .limit(15),
    ])
    setDeals((data ?? []) as Deal[])

    const settingsResult = await supabase
      .from('site_settings')
      .select('raise_committed')
      .maybeSingle()
    if (settingsResult.error) {
      setRaiseError(settingsResult.error.message)
    } else if (settingsResult.data) {
      setRaise(Number(settingsResult.data.raise_committed) || 0)
    }

    if (inquiriesResult.error) {
      setInquiriesError(inquiriesResult.error.message)
    } else {
      setInquiries((inquiriesResult.data ?? []) as InquiryWithDeal[])
    }
    setLoading(false)
  }

  async function saveRaise() {
    setRaiseError(null)
    const { error } = await supabase
      .from('site_settings')
      .update({ raise_committed: raise, updated_at: new Date().toISOString() })
      .eq('id', true)
    if (error) {
      setRaiseError(error.message)
      return
    }
    setRaiseSaved(Date.now())
    setTimeout(() => setRaiseSaved(null), 2500)
  }

  async function removeInquiry(inquiry: InquiryWithDeal) {
    if (!confirm(`Delete inquiry from ${inquiry.name}?`)) return
    setInquiries((list) => list.filter((i) => i.id !== inquiry.id))
    await supabase.from('deal_inquiries').delete().eq('id', inquiry.id)
  }

  if (loading) return <Spinner full />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Manage deals</h1>
          <p className="mt-1 text-sm text-ink-400">Create and update the projects your investors see.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to="/track-record"
            className="rounded-lg border border-gold-500/40 px-4 py-2 text-sm font-medium text-gold-400 transition-colors hover:bg-gold-500/10"
          >
            Rehab Work
          </Link>
          <Link
            to="/admin/leads"
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
          >
            Leads
          </Link>
          <Link
            to="/admin/audience"
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
          >
            Audience & access
          </Link>
          <Link
            to="/admin/deals/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400"
          >
            + New deal
          </Link>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-gold-500/30 bg-ink-900/40 p-4">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          💰 Capital raised (portfolio bar)
          {raiseSaved && <span className="text-xs font-medium text-brand-400">✓ Saved</span>}
        </h2>
        <p className="mb-3 text-xs text-ink-500">
          Drag to what you've raised — the milestone bar at the bottom of the deals page fills to
          match.
        </p>

        {raiseError ? (
          <div className="rounded-lg border border-gold-500/30 bg-gold-500/5 px-3.5 py-3 text-sm text-ink-200">
            Not set up yet — run{' '}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-ink-100">
              supabase/upgrade-2026-08d.sql
            </code>{' '}
            once in the Supabase SQL Editor. ({raiseError})
          </div>
        ) : (
          <>
            <MoneySlider
              label={`Raised of ${formatCurrency(RAISE_TOTAL)}`}
              value={raise}
              onChange={setRaise}
              max={RAISE_TOTAL}
              step={500}
              compareTo={RAISE_TOTAL}
              compareMode="raise"
              accent="gold"
            />
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {RAISE_TIERS.map((t) => (
                <span
                  key={t.amount}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    raise >= t.amount
                      ? 'bg-gold-500/20 font-medium text-gold-300'
                      : 'bg-ink-800 text-ink-400'
                  }`}
                >
                  {raise >= t.amount ? '✓ ' : ''}
                  {t.label} · {formatCurrency(t.amount)}
                </span>
              ))}
            </div>
            <button
              onClick={saveRaise}
              className="mt-3 rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Save raise
            </button>
          </>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          Recent investor inquiries
          {inquiries.length > 0 && (
            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-400">
              {inquiries.length}
            </span>
          )}
        </h2>

        {inquiriesError ? (
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-sm text-ink-200">
            Inquiries aren't set up in the database yet — run{' '}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-ink-100">
              supabase/upgrade-2026-08.sql
            </code>{' '}
            once in the Supabase SQL Editor (see README). Error: {inquiriesError}
          </div>
        ) : inquiries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-700 py-5 text-center text-sm text-ink-500">
            No inquiries yet — they land here the moment an investor hits "Partner on this deal."
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium text-white">{inquiry.name}</span>
                  {inquiry.deals && (
                    <Link
                      to={`/admin/deals/${inquiry.deals.slug}`}
                      className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-300 hover:text-white"
                    >
                      {inquiry.deals.title}
                    </Link>
                  )}
                  {inquiry.email && (
                    <a href={`mailto:${inquiry.email}`} className="text-sm text-brand-400 hover:underline">
                      {inquiry.email}
                    </a>
                  )}
                  {inquiry.phone && (
                    <a href={`tel:${inquiry.phone}`} className="text-sm text-brand-400 hover:underline">
                      {inquiry.phone}
                    </a>
                  )}
                  <span className="ml-auto text-xs text-ink-500">{formatDate(inquiry.created_at)}</span>
                  <button
                    onClick={() => removeInquiry(inquiry)}
                    className="rounded-md px-1.5 py-0.5 text-xs text-ink-500 hover:text-alert-400 cursor-pointer"
                    aria-label="Delete inquiry"
                  >
                    ✕
                  </button>
                </div>
                {inquiry.message && <p className="mt-1.5 text-sm text-ink-300">{inquiry.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {deals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-700 py-16 text-center text-ink-500">
          No deals yet — create your first one.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {deals.map((deal) => (
          <li key={deal.id}>
            <Link
              to={`/admin/deals/${deal.slug}`}
              className="flex items-center gap-3 rounded-xl border border-ink-700/60 bg-ink-900/40 p-3 transition-colors hover:border-ink-500 hover:bg-ink-800/60"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                {deal.cover_image_path ? (
                  <img src={getMediaUrl(deal.cover_image_path)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-ink-600">🏠</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{deal.title}</p>
                <p className="truncate text-sm text-ink-400">{deal.property_address || deal.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!deal.is_public && (
                  <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-300">
                    🔒 Private
                  </span>
                )}
                {deal.is_partnered && (
                  <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-medium text-gold-400">
                    Partnered
                  </span>
                )}
                {deal.is_illiquid && (
                  <span className="rounded-full bg-alert-500/15 px-2 py-0.5 text-xs font-medium text-alert-400">
                    Red alert
                  </span>
                )}
                <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs capitalize text-ink-300">
                  {deal.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
