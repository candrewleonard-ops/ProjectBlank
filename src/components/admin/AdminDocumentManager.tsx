import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { DealDocument, DocType } from '../../lib/types'
import Spinner from '../Spinner'

export default function AdminDocumentManager({ dealId }: { dealId: string }) {
  const [docs, setDocs] = useState<DealDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState<DocType>('pdf')
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [dealId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
    setDocs((data ?? []) as DealDocument[])
    setLoading(false)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    for (const file of Array.from(files)) {
      const path = `${dealId}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('deal-documents').upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        continue
      }
      await supabase.from('deal_documents').insert({
        deal_id: dealId,
        doc_type: docType,
        name: file.name,
        storage_path: path,
      })
    }

    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
    load()
  }

  async function remove(doc: DealDocument) {
    if (!confirm(`Remove "${doc.name}"?`)) return
    setDocs((d) => d.filter((x) => x.id !== doc.id))
    await supabase.storage.from('deal-documents').remove([doc.storage_path])
    await supabase.from('deal_documents').delete().eq('id', doc.id)
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-white">Documents & invoices</h2>

      {loading ? (
        <Spinner full={false} />
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {docs.length === 0 && <p className="text-sm text-ink-500">No documents yet.</p>}
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-900/40 px-3 py-2.5 text-sm"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink-800">
                {doc.doc_type === 'invoice' ? '🧾' : doc.doc_type === 'sheet' ? '📊' : '📄'}
              </span>
              <span className="flex-1 truncate text-ink-100">{doc.name}</span>
              <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 text-xs capitalize text-ink-400">
                {doc.doc_type}
              </span>
              <button
                onClick={() => remove(doc)}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-ink-500 hover:text-alert-400 cursor-pointer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
          className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        >
          <option value="pdf">Document / PDF</option>
          <option value="invoice">Invoice</option>
          <option value="sheet">Spreadsheet (CSV)</option>
        </select>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,image/*,.csv,text/csv"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
          className="block flex-1 text-sm text-ink-400 file:mr-3 file:rounded-lg file:border file:border-ink-600 file:bg-ink-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-200 hover:file:border-ink-400 cursor-pointer"
        />
      </div>
      {uploading && <p className="mt-2 text-xs text-ink-500">Uploading…</p>}
      {error && <p className="mt-2 text-xs text-alert-400">{error}</p>}
    </section>
  )
}
