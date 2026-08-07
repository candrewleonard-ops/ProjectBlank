import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { buildScopeTitles, OPTIONAL_SCOPE, type OptionalScopeKey } from '../../lib/rehabScope'
import type { DealTask } from '../../lib/types'

type ScopeRow = Pick<DealTask, 'deal_id' | 'title' | 'status' | 'position'> & {
  note?: string | null
}

// Drops the standard rehab scope onto a deal in one click, with bath counts
// and optional plumbing/foundation items that carry their own investor note.
export default function RehabScopeTemplate({
  dealId,
  startPosition,
  onAdded,
}: {
  dealId: string
  startPosition: number
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [fullBaths, setFullBaths] = useState(1)
  const [halfBaths, setHalfBaths] = useState(0)
  const [optional, setOptional] = useState<Record<OptionalScopeKey, boolean>>({
    plumbing: false,
    foundation: false,
  })
  const [notes, setNotes] = useState<Record<OptionalScopeKey, string>>({
    plumbing: '',
    foundation: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titles = buildScopeTitles(fullBaths, halfBaths)

  async function addScope() {
    setSaving(true)
    setError(null)

    let position = startPosition
    const rows: ScopeRow[] = titles.map((title) => ({
      deal_id: dealId,
      title,
      status: 'todo',
      position: position++,
    }))

    for (const item of OPTIONAL_SCOPE) {
      if (!optional[item.key]) continue
      rows.push({
        deal_id: dealId,
        title: item.title,
        status: 'todo',
        position: position++,
        note: notes[item.key].trim() || null,
      })
    }

    const { error: insertError } = await supabase.from('deal_tasks').insert(rows)
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setOpen(false)
    onAdded()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-3 w-full rounded-lg border border-dashed border-brand-500/40 bg-brand-500/5 px-4 py-2.5 text-sm font-semibold text-brand-400 transition-colors hover:bg-brand-500/10 cursor-pointer"
      >
        + Add standard rehab scope
      </button>
    )
  }

  return (
    <div className="mb-3 rounded-lg border border-brand-500/30 bg-ink-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Standard rehab scope</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-ink-400 hover:text-white cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Full bathrooms</label>
          <input
            type="number"
            min={0}
            max={10}
            value={fullBaths}
            onChange={(e) => setFullBaths(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Half baths</label>
          <input
            type="number"
            min={0}
            max={10}
            value={halfBaths}
            onChange={(e) => setHalfBaths(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-ink-400">Will add {titles.length} items:</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {titles.map((t) => (
          <span key={t} className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-300">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {OPTIONAL_SCOPE.map((item) => (
          <div key={item.key}>
            <label
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                optional[item.key]
                  ? 'border-brand-500/40 bg-brand-500/10 text-ink-100'
                  : 'border-ink-600 bg-ink-800/60 text-ink-300 hover:border-ink-500'
              }`}
            >
              <input
                type="checkbox"
                checked={optional[item.key]}
                onChange={(e) => setOptional((o) => ({ ...o, [item.key]: e.target.checked }))}
                className="h-4 w-4 accent-brand-500"
              />
              <span className="font-medium">{item.label}</span>
            </label>

            {optional[item.key] && (
              <div className="relative ml-6 mt-2">
                {/* little pointer up to the checkbox */}
                <span className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 border-l border-t border-brand-500/30 bg-ink-800" />
                <div className="relative rounded-lg border border-brand-500/30 bg-ink-800 p-3">
                  <label className="mb-1 block text-xs font-medium text-brand-400">
                    What's involved? (investors see this on the deal page)
                  </label>
                  <textarea
                    rows={3}
                    value={notes[item.key]}
                    onChange={(e) => setNotes((n) => ({ ...n, [item.key]: e.target.value }))}
                    placeholder={
                      item.key === 'plumbing'
                        ? 'Replacing galvanized supply lines throughout, new water heater.'
                        : 'Sealing two foundation cracks and regrading the north side.'
                    }
                    className="w-full resize-none rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
          {error}
        </p>
      )}

      <button
        onClick={addScope}
        disabled={saving}
        className="mt-4 rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
      >
        {saving ? 'Adding…' : `Add ${titles.length} scope items`}
      </button>
    </div>
  )
}
