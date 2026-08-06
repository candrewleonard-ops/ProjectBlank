import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatRelativeTime, formatCurrency } from '../lib/format'
import Spinner from '../components/Spinner'

interface Lead {
  id: string
  email: string
  name: string | null
  phone: string | null
  age_range: string | null
  wants_partnership: boolean
  created_at: string
  last_seen_at: string
}

interface LeadEvent {
  id: string
  lead_email: string
  event_type: 'signup' | 'deal_view' | 'funding_request' | 'note'
  deal_id: string | null
  detail: string | null
  amount: number | null
  created_at: string
}

const EVENT_META: Record<LeadEvent['event_type'], { icon: string; label: string }> = {
  signup: { icon: '✳️', label: 'Joined' },
  deal_view: { icon: '👀', label: 'Viewed' },
  funding_request: { icon: '💰', label: 'Funding interest' },
  note: { icon: '💬', label: 'Note' },
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [events, setEvents] = useState<LeadEvent[]>([])
  const [dealTitles, setDealTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [leadsRes, eventsRes, dealsRes] = await Promise.all([
      supabase.from('leads').select('*').order('last_seen_at', { ascending: false }),
      supabase.from('lead_events').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('deals').select('id, title'),
    ])

    if (leadsRes.error) {
      setError(`${leadsRes.error.message} — run supabase/upgrade-2026-08e.sql once.`)
      setLoading(false)
      return
    }

    setLeads((leadsRes.data ?? []) as Lead[])
    setEvents((eventsRes.data ?? []) as LeadEvent[])
    const titles: Record<string, string> = {}
    for (const d of (dealsRes.data ?? []) as { id: string; title: string }[]) titles[d.id] = d.title
    setDealTitles(titles)
    setLoading(false)
  }

  const eventsByEmail = useMemo(() => {
    const map: Record<string, LeadEvent[]> = {}
    for (const e of events) {
      const key = e.lead_email.toLowerCase()
      ;(map[key] ??= []).push(e)
    }
    return map
  }, [events])

  async function removeLead(lead: Lead) {
    if (!confirm(`Delete ${lead.email} and their activity?`)) return
    setLeads((l) => l.filter((x) => x.id !== lead.id))
    await supabase.from('lead_events').delete().eq('lead_email', lead.email)
    await supabase.from('leads').delete().eq('id', lead.id)
  }

  if (loading) return <Spinner full />

  const shown = query.trim()
    ? leads.filter((l) => l.email.toLowerCase().includes(query.trim().toLowerCase()))
    : leads
  const partnershipCount = leads.filter((l) => l.wants_partnership).length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white">
        ← Manage deals
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Leads</h1>
        <p className="mt-1 text-sm text-ink-400">
          Every email captured at the door, with the deals they opened and what they asked for.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-gold-500/30 bg-gold-500/5 px-4 py-3 text-sm text-ink-200">
          {error}
        </p>
      )}

      {!error && (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-center">
              <p className="text-xl font-semibold text-white">{leads.length}</p>
              <p className="mt-0.5 text-xs text-ink-500">Total leads</p>
            </div>
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-3 text-center">
              <p className="text-xl font-semibold text-brand-400">{partnershipCount}</p>
              <p className="mt-0.5 text-xs text-ink-500">Want partnerships</p>
            </div>
            <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-center">
              <p className="text-xl font-semibold text-white">{events.length}</p>
              <p className="mt-0.5 text-xs text-ink-500">Tracked actions</p>
            </div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email…"
            className="mb-4 w-full rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500"
          />

          {shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-700 py-14 text-center text-ink-500">
              {leads.length === 0
                ? 'No leads yet — every visitor who enters their email lands here.'
                : 'No leads match that search.'}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {shown.map((lead) => {
                const leadEvents = eventsByEmail[lead.email.toLowerCase()] ?? []
                const views = leadEvents.filter((e) => e.event_type === 'deal_view')
                const requests = leadEvents.filter((e) => e.event_type === 'funding_request')
                const isOpen = expanded === lead.id

                return (
                  <li
                    key={lead.id}
                    className={`overflow-hidden rounded-xl border bg-ink-900/40 ${
                      lead.wants_partnership ? 'border-brand-500/30' : 'border-ink-700/60'
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : lead.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium text-white">{lead.email}</span>
                          {lead.wants_partnership && (
                            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-400">
                              💰 Partnership
                            </span>
                          )}
                          {lead.age_range && (
                            <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-300">
                              {lead.age_range}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-500">
                          {lead.name ? `${lead.name} · ` : ''}
                          {views.length} deal{views.length === 1 ? '' : 's'} viewed ·{' '}
                          {requests.length} request{requests.length === 1 ? '' : 's'} · last seen{' '}
                          {formatRelativeTime(lead.last_seen_at)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-400">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-ink-700/60 px-4 py-3">
                        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                          <span>Joined {formatDate(lead.created_at)}</span>
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="text-brand-400 hover:underline">
                              {lead.phone}
                            </a>
                          )}
                          <a href={`mailto:${lead.email}`} className="text-brand-400 hover:underline">
                            Email them
                          </a>
                        </div>

                        {leadEvents.length === 0 ? (
                          <p className="text-sm text-ink-500">No activity recorded yet.</p>
                        ) : (
                          <ol className="flex flex-col gap-1.5">
                            {leadEvents.slice(0, 40).map((e) => (
                              <li key={e.id} className="flex items-start gap-2.5 text-sm">
                                <span aria-hidden="true" className="mt-0.5 shrink-0">
                                  {EVENT_META[e.event_type].icon}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="text-ink-200">
                                    {EVENT_META[e.event_type].label}
                                    {e.deal_id && dealTitles[e.deal_id] && (
                                      <span className="font-medium text-white">
                                        {' '}
                                        {dealTitles[e.deal_id]}
                                      </span>
                                    )}
                                    {e.amount !== null && (
                                      <span className="font-medium text-brand-400">
                                        {' '}
                                        {formatCurrency(e.amount)}
                                      </span>
                                    )}
                                  </span>
                                  {e.detail && (
                                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">
                                      {e.detail}
                                    </span>
                                  )}
                                </span>
                                <span className="shrink-0 text-xs text-ink-500">
                                  {formatRelativeTime(e.created_at)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}

                        <button
                          onClick={() => removeLead(lead)}
                          className="mt-3 text-xs text-ink-500 hover:text-alert-400 cursor-pointer"
                        >
                          Delete lead
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
