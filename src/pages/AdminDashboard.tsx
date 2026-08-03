import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Deal } from '../lib/types'
import { getMediaUrl } from '../lib/storage'
import Spinner from '../components/Spinner'

export default function AdminDashboard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
    setDeals((data ?? []) as Deal[])
    setLoading(false)
  }

  if (loading) return <Spinner full />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Manage deals</h1>
          <p className="mt-1 text-sm text-ink-400">Create and update the projects your investors see.</p>
        </div>
        <Link
          to="/admin/deals/new"
          className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400"
        >
          + New deal
        </Link>
      </div>

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
