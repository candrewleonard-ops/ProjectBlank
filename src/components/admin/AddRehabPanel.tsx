import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Deal } from '../../lib/types'
import { slugify } from '../../lib/format'
import MoneySlider from './MoneySlider'

// Builds out a past rehab straight from the Rehab Work page.
export default function AddRehabPanel({ onCreated }: { onCreated: (deal: Deal) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [purchase, setPurchase] = useState(0)
  const [rehab, setRehab] = useState(0)
  const [sold, setSold] = useState(0)
  const [soldDate, setSoldDate] = useState('')
  const [outcome, setOutcome] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setAddress('')
    setPurchase(0)
    setRehab(0)
    setSold(0)
    setSoldDate('')
    setOutcome('')
    setIsPublic(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const baseSlug = slugify(title) || `rehab-${Date.now()}`
    const { data, error: insertError } = await supabase
      .from('deals')
      .insert({
        title: title.trim(),
        slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'completed',
        property_address: address.trim() || null,
        purchase_price: purchase || null,
        rehab_spent: rehab || null,
        sold_price: sold || null,
        sold_date: soldDate || null,
        lender_outcome: outcome.trim() || null,
        is_public: isPublic,
      })
      .select()
      .single()

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onCreated(data as Deal)
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 w-full rounded-xl border border-dashed border-gold-500/40 bg-gold-500/5 px-4 py-3.5 text-sm font-semibold text-gold-400 transition-colors hover:bg-gold-500/10 cursor-pointer"
      >
        + Add a past rehab
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-gold-500/30 bg-ink-900/60 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Add a past rehab</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-400 hover:text-white cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dayton, OH Flip"
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            Address (street stays private)
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Dayton, OH"
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MoneySlider label="Purchase price" value={purchase} onChange={setPurchase} max={500000} />
        <MoneySlider label="Rehab spent" value={rehab} onChange={setRehab} max={150000} />
        <MoneySlider label="Sold for" value={sold} onChange={setSold} max={500000} accent="gold" />
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Sold date</label>
          <input
            type="date"
            value={soldDate}
            onChange={(e) => setSoldDate(e.target.value)}
            className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-ink-400">Lender outcome</label>
        <input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Lender repaid in full plus 12% — 5 months"
          className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        />
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-ink-200">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 accent-brand-500"
        />
        Public — show this rehab to everyone
      </label>

      {error && (
        <p className="mt-3 rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-5 py-2 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
      >
        {saving ? 'Adding…' : 'Add rehab'}
      </button>
      <p className="mt-2 text-xs text-ink-500">
        Add photos and a before/after pair afterwards from the full editor.
      </p>
    </form>
  )
}
