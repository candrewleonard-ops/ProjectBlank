import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Deal, TaskStatus } from '../lib/types'
import DealCard from '../components/DealCard'
import Spinner from '../components/Spinner'

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Active deals</h1>
        <p className="mt-1 text-sm text-ink-400">Live status on every project — updated as work happens.</p>
      </div>

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
        {deals.map((deal, i) => (
          <DealCard
            key={deal.id}
            deal={deal}
            eager={i === 0}
            counts={counts[deal.id] ?? { todo: 0, complete: 0, red_alert: 0 }}
          />
        ))}
      </div>
    </div>
  )
}
