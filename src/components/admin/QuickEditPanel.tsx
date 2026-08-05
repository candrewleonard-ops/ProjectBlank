import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Deal, DealStatus } from '../../lib/types'
import MoneySlider from './MoneySlider'

// Admin-only inline editor that lives on the public deal page, so the numbers
// can be updated while looking at exactly what investors see.
export default function QuickEditPanel({
  deal,
  onSaved,
}: {
  deal: Deal
  onSaved: (deal: Deal) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Deal>(deal)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    draft.rehab_budget !== deal.rehab_budget ||
    draft.rehab_spent !== deal.rehab_spent ||
    draft.raise_target !== deal.raise_target ||
    draft.raise_committed !== deal.raise_committed ||
    draft.arv !== deal.arv ||
    draft.lien_amount !== deal.lien_amount ||
    draft.current_focus !== deal.current_focus ||
    draft.status !== deal.status ||
    draft.is_illiquid !== deal.is_illiquid ||
    draft.alert_reason !== deal.alert_reason

  function set<K extends keyof Deal>(key: K, value: Deal[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    const { data, error: updateError } = await supabase
      .from('deals')
      .update({
        rehab_budget: draft.rehab_budget,
        rehab_spent: draft.rehab_spent,
        raise_target: draft.raise_target,
        raise_committed: draft.raise_committed,
        arv: draft.arv,
        lien_amount: draft.lien_amount,
        current_focus: draft.current_focus?.trim() || null,
        status: draft.status,
        is_illiquid: draft.is_illiquid,
        alert_reason: draft.is_illiquid ? draft.alert_reason?.trim() || null : null,
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

  const raising = draft.raise_target !== null && draft.raise_target > 0

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gold-500/30 bg-ink-900/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gold-500/15 text-sm">🛠️</span>
          <span className="text-sm font-semibold text-white">
            Admin quick edit
            <span className="ml-2 font-normal text-ink-400">
              — update this deal without leaving the page
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs">
          {savedAt && <span className="font-medium text-brand-400">✓ Saved</span>}
          {dirty && !savedAt && <span className="font-medium text-gold-400">Unsaved</span>}
          <span className="text-ink-400">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-700/60 px-4 pb-4 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MoneySlider
              label="ARV"
              value={draft.arv ?? 0}
              onChange={(v) => set('arv', v)}
              max={500000}
            />
            <MoneySlider
              label="Total lien (incl. rehab)"
              value={draft.lien_amount ?? 0}
              onChange={(v) => set('lien_amount', v)}
              max={500000}
            />
            <MoneySlider
              label="Rehab budget"
              value={draft.rehab_budget ?? 0}
              onChange={(v) => set('rehab_budget', v)}
              max={150000}
            />
            <MoneySlider
              label="Rehab drawn to date"
              value={draft.rehab_spent ?? 0}
              onChange={(v) => set('rehab_spent', v)}
              max={150000}
              compareTo={draft.rehab_budget}
              compareMode="spend"
            />
          </div>

          <div className="mt-4 rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gold-400">
              Open raise on this deal
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MoneySlider
                label="Raise target (0 = no raise shown)"
                value={draft.raise_target ?? 0}
                onChange={(v) => set('raise_target', v === 0 ? null : v)}
                max={150000}
                accent="gold"
              />
              <MoneySlider
                label="Committed so far"
                value={draft.raise_committed ?? 0}
                onChange={(v) => set('raise_committed', v)}
                max={Math.max(draft.raise_target ?? 0, 150000)}
                compareTo={draft.raise_target}
                compareMode="raise"
                accent="gold"
              />
            </div>
            {!raising && (
              <p className="mt-2 text-xs text-ink-500">
                Target at $0 hides the funding bar from investors.
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                Currently working on
              </label>
              <input
                value={draft.current_focus ?? ''}
                onChange={(e) => set('current_focus', e.target.value)}
                placeholder="Kitchen remodel & flooring"
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Status</label>
              <select
                value={draft.status}
                onChange={(e) => set('status', e.target.value as DealStatus)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-alert-500/20 bg-alert-500/5 p-3">
            <label className="flex items-center gap-2 text-sm text-ink-200">
              <input
                type="checkbox"
                checked={draft.is_illiquid}
                onChange={(e) => set('is_illiquid', e.target.checked)}
                className="h-4 w-4 accent-alert-500"
              />
              Needs financing — show the "Financing open" card
            </label>
            {draft.is_illiquid && (
              <input
                value={draft.alert_reason ?? ''}
                onChange={(e) => set('alert_reason', e.target.value)}
                placeholder="Illiquid Project"
                className="mt-2.5 w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-alert-500"
              />
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {saving ? 'Saving…' : savedAt ? '✓ Saved' : 'Save changes'}
            </button>
            {dirty && (
              <button
                onClick={() => setDraft(deal)}
                className="rounded-lg border border-ink-600 px-3.5 py-2 text-sm font-medium text-ink-300 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
              >
                Reset
              </button>
            )}
            <Link
              to={`/admin/deals/${deal.slug}`}
              className="ml-auto text-xs text-ink-400 hover:text-brand-400"
            >
              Full editor (photos, docs, tasks) →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
