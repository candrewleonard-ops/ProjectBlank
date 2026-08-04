import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Deal, DealStatus } from '../lib/types'
import { slugify } from '../lib/format'
import Spinner from '../components/Spinner'
import AdminTaskManager from '../components/admin/AdminTaskManager'
import AdminMediaManager from '../components/admin/AdminMediaManager'
import AdminDocumentManager from '../components/admin/AdminDocumentManager'
import AdminInquiries from '../components/admin/AdminInquiries'

interface FormState {
  title: string
  slug: string
  status: DealStatus
  current_focus: string
  drive_url: string
  property_address: string
  year_built: string
  exterior_type: string
  arv: string
  lien_amount: string
  rehab_budget: string
  rehab_spent: string
  budget_variance_note: string
  is_illiquid: boolean
  alert_reason: string
}

const EMPTY: FormState = {
  title: '',
  slug: '',
  status: 'active',
  current_focus: '',
  drive_url: '',
  property_address: '',
  year_built: '',
  exterior_type: '',
  arv: '',
  lien_amount: '',
  rehab_budget: '',
  rehab_spent: '',
  budget_variance_note: '',
  is_illiquid: false,
  alert_reason: '',
}

function dealToForm(deal: Deal): FormState {
  return {
    title: deal.title,
    slug: deal.slug,
    status: deal.status,
    current_focus: deal.current_focus ?? '',
    drive_url: deal.drive_url ?? '',
    property_address: deal.property_address ?? '',
    year_built: deal.year_built ?? '',
    exterior_type: deal.exterior_type ?? '',
    arv: deal.arv?.toString() ?? '',
    lien_amount: deal.lien_amount?.toString() ?? '',
    rehab_budget: deal.rehab_budget?.toString() ?? '',
    rehab_spent: deal.rehab_spent?.toString() ?? '',
    budget_variance_note: deal.budget_variance_note ?? '',
    is_illiquid: deal.is_illiquid,
    alert_reason: deal.alert_reason ?? '',
  }
}

function toNumberOrNull(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export default function AdminDealEditor() {
  const { slug } = useParams<{ slug: string }>()
  const isNew = !slug
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [deal, setDeal] = useState<Deal | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('deals').select('*').eq('slug', slug).maybeSingle()
      if (!cancelled && data) {
        setDeal(data as Deal)
        setForm(dealToForm(data as Deal))
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug, isNew])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleTitleChange(value: string) {
    update('title', value)
    if (!slugTouched) update('slug', slugify(value))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      status: form.status,
      current_focus: form.current_focus.trim() || null,
      drive_url: form.drive_url.trim() || null,
      property_address: form.property_address || null,
      year_built: form.year_built || null,
      exterior_type: form.exterior_type || null,
      arv: toNumberOrNull(form.arv),
      lien_amount: toNumberOrNull(form.lien_amount),
      rehab_budget: toNumberOrNull(form.rehab_budget),
      rehab_spent: toNumberOrNull(form.rehab_spent),
      budget_variance_note: form.budget_variance_note || null,
      is_illiquid: form.is_illiquid,
      alert_reason: form.is_illiquid ? form.alert_reason || null : null,
    }

    if (isNew) {
      const { data, error } = await supabase
        .from('deals')
        .insert({ ...payload, created_by: profile?.id })
        .select()
        .single()
      setSaving(false)
      if (error) {
        setError(error.message)
        return
      }
      navigate(`/admin/deals/${(data as Deal).slug}`)
      return
    }

    const { data, error } = await supabase.from('deals').update(payload).eq('id', deal!.id).select().single()
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setDeal(data as Deal)
    setNotice('Saved.')
    if ((data as Deal).slug !== slug) navigate(`/admin/deals/${(data as Deal).slug}`, { replace: true })
  }

  if (loading) return <Spinner full />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white">
        ← All deals
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-white">
        {isNew ? 'New deal' : `Edit ${deal?.title}`}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Basics</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput label="Deal title" required value={form.title} onChange={handleTitleChange} />
            <LabeledInput
              label="URL slug"
              required
              value={form.slug}
              onChange={(v) => {
                setSlugTouched(true)
                update('slug', v)
              }}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value as DealStatus)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <LabeledInput
              label="Property address"
              value={form.property_address}
              onChange={(v) => update('property_address', v)}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput
              label='Currently working on (shows live as "Now: …")'
              value={form.current_focus}
              onChange={(v) => update('current_focus', v)}
            />
            <LabeledInput
              label="Google Drive album link (optional)"
              type="url"
              value={form.drive_url}
              onChange={(v) => update('drive_url', v)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Property details</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput label="Year built" value={form.year_built} onChange={(v) => update('year_built', v)} />
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Exterior</label>
              <select
                value={form.exterior_type}
                onChange={(e) => update('exterior_type', e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              >
                <option value="">—</option>
                <option value="Brick">Brick</option>
                <option value="Vinyl">Vinyl</option>
                <option value="Wood">Wood</option>
                <option value="Stucco">Stucco</option>
                <option value="Fiber cement">Fiber cement</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Financing & rehab budget</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput label="ARV ($)" type="number" value={form.arv} onChange={(v) => update('arv', v)} />
            <LabeledInput
              label="Lien, incl. rehab budget ($)"
              type="number"
              value={form.lien_amount}
              onChange={(v) => update('lien_amount', v)}
            />
            <LabeledInput
              label="Rehab budget ($)"
              type="number"
              value={form.rehab_budget}
              onChange={(v) => update('rehab_budget', v)}
            />
            <LabeledInput
              label="Rehab spent to date ($)"
              type="number"
              value={form.rehab_spent}
              onChange={(v) => update('rehab_spent', v)}
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Budget variance note (e.g. "$5k under budget" or "$15k over")
            </label>
            <input
              value={form.budget_variance_note}
              onChange={(e) => update('budget_variance_note', e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
        </section>

        <section className="rounded-xl border border-alert-500/20 bg-ink-900/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Red alert</h2>
          <label className="flex items-center gap-2 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={form.is_illiquid}
              onChange={(e) => update('is_illiquid', e.target.checked)}
              className="h-4 w-4 accent-alert-500"
            />
            This deal is illiquid / paused — show the financing pop-up to investors
          </label>
          {form.is_illiquid && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-ink-400">Reason</label>
              <input
                value={form.alert_reason}
                onChange={(e) => update('alert_reason', e.target.value)}
                placeholder="Illiquid Project"
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-alert-500"
              />
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-sm text-alert-400">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm text-brand-400">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-400 disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Saving…' : isNew ? 'Create deal' : 'Save changes'}
        </button>
      </form>

      {deal && (
        <div className="mt-10 flex flex-col gap-8">
          <AdminInquiries dealId={deal.id} />
          <AdminMediaManager
            dealId={deal.id}
            coverImagePath={deal.cover_image_path}
            onCoverChange={(path) => setDeal({ ...deal, cover_image_path: path })}
          />
          <AdminDocumentManager dealId={deal.id} />
          <AdminTaskManager dealId={deal.id} />
        </div>
      )}

      {isNew && (
        <p className="mt-8 text-sm text-ink-500">Save the deal first to add tasks, photos, and documents.</p>
      )}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
      />
    </div>
  )
}
