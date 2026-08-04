import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Deal, Subscriber } from '../lib/types'
import { formatDate } from '../lib/format'
import Spinner from '../components/Spinner'

interface AccessRow {
  id: string
  deal_id: string
  email: string
}

interface AudienceEntry {
  email: string
  source: 'subscriber' | 'account' | 'both'
  wants_deal_emails: boolean | null
  wants_live_updates: boolean | null
  created_at: string
}

export default function AdminAudience() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [profileEmails, setProfileEmails] = useState<{ email: string; created_at: string }[]>([])
  const [access, setAccess] = useState<AccessRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const [dealsRes, subsRes, profilesRes, accessRes] = await Promise.all([
      supabase.from('deals').select('*').neq('status', 'archived').order('created_at'),
      supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('email, created_at'),
      supabase.from('deal_access').select('id, deal_id, email'),
    ])
    if (subsRes.error || accessRes.error) {
      setError(
        (subsRes.error ?? accessRes.error)!.message +
          ' — make sure supabase/upgrade-2026-08b.sql has been run.',
      )
      setLoading(false)
      return
    }
    setDeals((dealsRes.data ?? []) as Deal[])
    setSubscribers((subsRes.data ?? []) as Subscriber[])
    setProfileEmails(
      ((profilesRes.data ?? []) as { email: string | null; created_at: string }[]).filter(
        (p): p is { email: string; created_at: string } => Boolean(p.email),
      ),
    )
    setAccess((accessRes.data ?? []) as AccessRow[])
    setLoading(false)
  }

  const audience: AudienceEntry[] = useMemo(() => {
    const map = new Map<string, AudienceEntry>()
    for (const s of subscribers) {
      map.set(s.email.toLowerCase(), {
        email: s.email.toLowerCase(),
        source: 'subscriber',
        wants_deal_emails: s.wants_deal_emails,
        wants_live_updates: s.wants_live_updates,
        created_at: s.created_at,
      })
    }
    for (const p of profileEmails) {
      const key = p.email.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.source = 'both'
      } else {
        map.set(key, {
          email: key,
          source: 'account',
          wants_deal_emails: null,
          wants_live_updates: null,
          created_at: p.created_at,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [subscribers, profileEmails])

  const privateDeals = deals.filter((d) => !d.is_public)

  function hasAccess(email: string, dealId: string) {
    return access.some((a) => a.email.toLowerCase() === email && a.deal_id === dealId)
  }

  async function toggleAccess(email: string, dealId: string) {
    const existing = access.find((a) => a.email.toLowerCase() === email && a.deal_id === dealId)
    if (existing) {
      setAccess((rows) => rows.filter((r) => r.id !== existing.id))
      await supabase.from('deal_access').delete().eq('id', existing.id)
    } else {
      const optimistic: AccessRow = { id: `tmp-${crypto.randomUUID()}`, deal_id: dealId, email }
      setAccess((rows) => [...rows, optimistic])
      const { data } = await supabase
        .from('deal_access')
        .insert({ deal_id: dealId, email })
        .select('id, deal_id, email')
        .single()
      if (data) {
        setAccess((rows) => rows.map((r) => (r.id === optimistic.id ? (data as AccessRow) : r)))
      }
    }
  }

  async function removeSubscriber(email: string) {
    if (!confirm(`Remove ${email} from the email list?`)) return
    setSubscribers((subs) => subs.filter((s) => s.email.toLowerCase() !== email))
    await supabase.from('subscribers').delete().eq('email', email)
  }

  if (loading) return <Spinner full />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white">
        ← Manage deals
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Audience & deal access</h1>
        <p className="mt-1 text-sm text-ink-400">
          Everyone who left their email or created an account. Tick a box to grant access to a
          private deal — it applies the moment they sign in with that email.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-alert-500/30 bg-alert-500/10 px-4 py-3 text-sm text-alert-400">
          {error}
        </p>
      )}

      {privateDeals.length === 0 && !error && (
        <p className="mb-6 rounded-xl border border-ink-700/60 bg-ink-900/40 px-4 py-3 text-sm text-ink-400">
          All deals are currently public. Untick "Public" on a deal to make it private, then grant
          access here.
        </p>
      )}

      {audience.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-ink-700 py-16 text-center text-ink-500">
          Nobody on the list yet — emails land here from the popup and from account sign-ups.
        </div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-xl border border-ink-700/60">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink-800/80 text-left">
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-300">
                  Email
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ink-300">
                  Source
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ink-300">
                  Wants
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ink-300">
                  Joined
                </th>
                {privateDeals.map((d) => (
                  <th
                    key={d.id}
                    className="whitespace-nowrap px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-300"
                    title={d.title}
                  >
                    🔒 {d.title.replace(' Flip', '')}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {audience.map((entry, i) => (
                <tr key={entry.email} className={i % 2 === 1 ? 'bg-ink-900/40' : ''}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-white">
                    <a href={`mailto:${entry.email}`} className="hover:text-brand-400">
                      {entry.email}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        entry.source === 'account' || entry.source === 'both'
                          ? 'bg-brand-500/15 text-brand-400'
                          : 'bg-ink-800 text-ink-300'
                      }`}
                    >
                      {entry.source === 'both'
                        ? 'Account + list'
                        : entry.source === 'account'
                          ? 'Account'
                          : 'Email list'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-400">
                    {entry.wants_deal_emails === null
                      ? '—'
                      : [
                          entry.wants_deal_emails ? 'Deals' : null,
                          entry.wants_live_updates ? 'Live updates' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Nothing'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-500">
                    {formatDate(entry.created_at)}
                  </td>
                  {privateDeals.map((d) => (
                    <td key={d.id} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={hasAccess(entry.email, d.id)}
                        onChange={() => toggleAccess(entry.email, d.id)}
                        className="h-4 w-4 cursor-pointer accent-brand-500"
                        aria-label={`Grant ${entry.email} access to ${d.title}`}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right">
                    {(entry.source === 'subscriber' || entry.source === 'both') && (
                      <button
                        onClick={() => removeSubscriber(entry.email)}
                        className="rounded-md px-1.5 py-0.5 text-xs text-ink-500 hover:text-alert-400 cursor-pointer"
                        aria-label={`Remove ${entry.email}`}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
