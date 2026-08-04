import { useEffect, useState } from 'react'
import { getSignedDocUrl } from '../lib/storage'
import { parseCsv, looksNumeric } from '../lib/csv'
import type { DealDocument } from '../lib/types'
import Spinner from './Spinner'

const MAX_ROWS = 2000

export default function SheetViewerModal({
  doc,
  onClose,
}: {
  doc: DealDocument
  onClose: () => void
}) {
  const [rows, setRows] = useState<string[][] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const url = await getSignedDocUrl(doc.storage_path)
      if (!url) {
        if (!cancelled) setError("Couldn't open this file — try again or re-upload it.")
        return
      }
      try {
        const res = await fetch(url)
        const text = await res.text()
        if (!cancelled) setRows(parseCsv(text).slice(0, MAX_ROWS))
      } catch {
        if (!cancelled) setError("Couldn't read this file — make sure it's a CSV.")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [doc])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const header = rows && rows.length > 0 ? rows[0] : null
  const body = rows && rows.length > 1 ? rows.slice(1) : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-900 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-700/60 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-500/10 text-sm">
              📊
            </span>
            <h2 className="truncate text-sm font-semibold text-white">{doc.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-auto">
          {error && <p className="px-5 py-8 text-center text-sm text-alert-400">{error}</p>}
          {!error && !rows && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {rows && rows.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-500">This file is empty.</p>
          )}
          {header && (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-ink-800">
                  {header.map((cell, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap border-b border-ink-600 px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-300"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((r, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? 'bg-ink-800/40' : ''}>
                    {header.map((_, ci) => {
                      const cell = r[ci] ?? ''
                      return (
                        <td
                          key={ci}
                          className={`whitespace-nowrap border-b border-ink-800 px-3.5 py-2 text-ink-100 ${
                            looksNumeric(cell) ? 'text-right tabular-nums' : ''
                          }`}
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="border-t border-ink-700/60 px-5 py-2.5 text-xs text-ink-500">
          {body.length > 0 ? `${body.length} rows` : ''}
        </p>
      </div>
    </div>
  )
}
