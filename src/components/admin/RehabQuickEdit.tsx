import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Deal } from '../../lib/types'
import MoneySlider from './MoneySlider'

// Inline editor for a finished rehab, shown to admins right on the public
// Rehab Work page so the numbers can be filled in where they'll appear.
export default function RehabQuickEdit({
  deal,
  onSaved,
  onRemoved,
}: {
  deal: Deal
  onSaved: (deal: Deal) => void
  onRemoved: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Deal>(deal)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    draft.purchase_price !== deal.purchase_price ||
    draft.rehab_spent !== deal.rehab_spent ||
    draft.sold_price !== deal.sold_price ||
    draft.sold_date !== deal.sold_date ||
    draft.lender_outcome !== deal.lender_outcome ||
    draft.title !== deal.title ||
    draft.is_public !== deal.is_public

  function set<K extends keyof Deal>(key: K, value: Deal[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    const { data, error: updateError } = await supabase
      .from('deals')
      .update({
        title: draft.title.trim(),
        purchase_price: draft.purchase_price,
        rehab_spent: draft.rehab_spent,
        sold_price: draft.sold_price,
        sold_date: draft.sold_date || null,
        lender_outcome: draft.lender_outcome?.trim() || null,
        is_public: draft.is_public,
      })
      .eq('id', deal.id)
      .select()
      .single()
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    const saved = data as Deal
    setDraft(saved)
    onSaved(saved)
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 2500)
  }

  async function moveBackToActive() {
    if (!confirm(`Move "${deal.title}" back to active deals?`)) return
    await supabase.from('deals').update({ status: 'active' }).eq('id', deal.id)
    onRemoved(deal.id)
  }

  return (
    <div className="border-t border-gold-500/20 bg-ink-950/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gold-400">
          🛠️ Edit this rehab
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs">
          {savedAt && <span className="font-medium text-brand-400">✓ Saved</span>}
          {dirty && !savedAt && <span className="font-medium text-gold-400">Unsaved</span>}
          <span className="text-ink-400">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
            <input
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MoneySlider
              label="Purchase price"
              value={draft.purchase_price ?? 0}
              onChange={(v) => set('purchase_price', v === 0 ? null : v)}
              max={500000}
            />
            <MoneySlider
              label="Rehab spent"
              value={draft.rehab_spent ?? 0}
              onChange={(v) => set('rehab_spent', v === 0 ? null : v)}
              max={150000}
            />
            <MoneySlider
              label="Sold for"
              value={draft.sold_price ?? 0}
              onChange={(v) => set('sold_price', v === 0 ? null : v)}
              max={500000}
              accent="gold"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Sold date</label>
              <input
                type="date"
                value={draft.sold_date ?? ''}
                onChange={(e) => set('sold_date', e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Lender outcome (shown to investors)
            </label>
            <input
              value={draft.lender_outcome ?? ''}
              onChange={(e) => set('lender_outcome', e.target.value)}
              placeholder="Lender repaid in full plus 12% — 5 months"
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>

          <label
            className={`mt-3 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              draft.is_public
                ? 'border-brand-500/40 bg-brand-500/10 text-ink-100'
                : 'border-ink-600 bg-ink-800/60 text-ink-300'
            }`}
          >
            <input
              type="checkbox"
              checked={draft.is_public}
              onChange={(e) => set('is_public', e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            <span>{draft.is_public ? '🌐 Public' : '🔒 Private — only granted emails'}</span>
          </label>

          {error && (
            <p className="mt-3 rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {saving ? 'Saving…' : savedAt ? '✓ Saved' : 'Save'}
            </button>
            <Link
              to={`/admin/deals/${deal.slug}`}
              className="rounded-lg border border-ink-600 px-3 py-2 text-xs font-medium text-ink-300 hover:border-ink-400 hover:text-white"
            >
              Photos & docs →
            </Link>
            <button
              onClick={moveBackToActive}
              className="ml-auto text-xs text-ink-500 hover:text-alert-400 cursor-pointer"
            >
              Move back to active
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
