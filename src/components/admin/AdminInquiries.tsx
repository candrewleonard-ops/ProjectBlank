import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { DealInquiry } from '../../lib/types'
import { formatDate } from '../../lib/format'
import Spinner from '../Spinner'

export default function AdminInquiries({ dealId }: { dealId: string }) {
  const [inquiries, setInquiries] = useState<DealInquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('deal_inquiries')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setInquiries((data ?? []) as DealInquiry[])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dealId])

  async function remove(inquiry: DealInquiry) {
    if (!confirm(`Delete inquiry from ${inquiry.name}?`)) return
    setInquiries((list) => list.filter((i) => i.id !== inquiry.id))
    await supabase.from('deal_inquiries').delete().eq('id', inquiry.id)
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        Investor inquiries
        {inquiries.length > 0 && (
          <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-400">
            {inquiries.length}
          </span>
        )}
      </h2>

      {loading ? (
        <Spinner full={false} />
      ) : inquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-700 py-6 text-center text-sm text-ink-500">
          No inquiries yet — they'll show up here when investors hit "Partner on this deal."
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.id}
              className="rounded-lg border border-ink-700/60 bg-ink-900/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-white">{inquiry.name}</span>
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
                  onClick={() => remove(inquiry)}
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
  )
}
