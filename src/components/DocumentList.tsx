import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSignedDocUrl } from '../lib/storage'
import { useAuth } from '../context/AuthContext'
import type { DealDocument, DocType } from '../lib/types'
import Spinner from './Spinner'
import SheetViewerModal from './SheetViewerModal'

export default function DocumentList({ dealId, docType }: { dealId: string; docType: DocType }) {
  const { user } = useAuth()
  const [docs, setDocs] = useState<DealDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState<string | null>(null)
  const [viewingSheet, setViewingSheet] = useState<DealDocument | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId)
        .eq('doc_type', docType)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setDocs((data ?? []) as DealDocument[])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dealId, docType])

  async function open(doc: DealDocument) {
    if (doc.doc_type === 'sheet') {
      setViewingSheet(doc)
      return
    }
    setOpening(doc.id)
    const url = await getSignedDocUrl(doc.storage_path)
    setOpening(null)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-ink-700 py-8 text-center">
        <p className="text-sm text-ink-400">
          {docType === 'pdf' ? 'Documents' : docType === 'invoice' ? 'Invoices' : 'Budget spreadsheets'} are for signed-in investors.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-block text-sm font-medium text-brand-400 hover:underline"
        >
          Sign in or create a free account →
        </Link>
      </div>
    )
  }

  if (loading) return <Spinner full={false} />

  if (docs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-700 py-6 text-center text-sm text-ink-500">
        No {docType === 'pdf' ? 'documents' : docType === 'invoice' ? 'invoices' : 'spreadsheets'} posted yet.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {docs.map((doc) => (
        <li key={doc.id}>
          <button
            onClick={() => open(doc)}
            disabled={opening === doc.id}
            className="flex w-full items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-900/40 px-3 py-2.5 text-left text-sm transition-colors hover:border-ink-500 hover:bg-ink-800/60 disabled:opacity-60 cursor-pointer"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink-800 text-sm">
              {docType === 'invoice' ? '🧾' : docType === 'sheet' ? '📊' : '📄'}
            </span>
            <span className="flex-1 truncate text-ink-100">{doc.name}</span>
            <span className="shrink-0 text-xs text-ink-500">{opening === doc.id ? 'Opening…' : 'View →'}</span>
          </button>
        </li>
      ))}
      {viewingSheet && <SheetViewerModal doc={viewingSheet} onClose={() => setViewingSheet(null)} />}
    </ul>
  )
}
