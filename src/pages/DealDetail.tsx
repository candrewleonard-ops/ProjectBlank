import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getMediaUrl } from '../lib/storage'
import type { Deal, DealTask } from '../lib/types'
import { formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { publicLocation, CONTACT_PHONE, CONTACT_PHONE_HREF } from '../lib/site'
import Spinner from '../components/Spinner'
import TaskBoard from '../components/TaskBoard'
import MediaGallery from '../components/MediaGallery'
import DealInfoTab from '../components/DealInfoTab'
import DocumentList from '../components/DocumentList'
import IlliquidModal from '../components/IlliquidModal'
import AlertBanner from '../components/AlertBanner'
import FinancialStrip from '../components/FinancialStrip'
import ReservesStrip from '../components/ReservesStrip'
import InquiryModal from '../components/InquiryModal'
import AssetShowcase from '../components/AssetShowcase'
import ContactCta from '../components/ContactCta'
import FundingBar from '../components/FundingBar'
import PayoffCalculator from '../components/PayoffCalculator'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import QuickEditPanel from '../components/admin/QuickEditPanel'

type Tab = 'overview' | 'media' | 'info' | 'invoices'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'media', label: 'Photos & Video' },
  { id: 'info', label: 'Deal Information' },
  { id: 'invoices', label: 'Invoices' },
]

export default function DealDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isAdmin } = useAuth()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [tasks, setTasks] = useState<DealTask[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryAmount, setInquiryAmount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setNotFound(false)
      const { data: dealRow } = await supabase.from('deals').select('*').eq('slug', slug).maybeSingle()

      if (!dealRow) {
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
        return
      }

      const [{ data: taskRows }] = await Promise.all([
        supabase.from('deal_tasks').select('*').eq('deal_id', dealRow.id).order('position'),
      ])

      if (!cancelled) {
        setDeal(dealRow as Deal)
        setTasks((taskRows ?? []) as DealTask[])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) return <Spinner full />

  if (notFound || !deal) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ink-800 text-2xl">🔒</div>
        <p className="text-lg font-medium text-white">
          {user ? 'This deal is private' : 'This deal may be private'}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-400">
          {user
            ? `Your account doesn't have access to this deal yet. Call ${CONTACT_PHONE} and we'll open it up for you.`
            : 'Sign in with the email we have on file, or reach out and we\'ll grant you access.'}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {!user && (
            <Link
              to="/login"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-brand-400"
            >
              Sign in
            </Link>
          )}
          <a
            href={CONTACT_PHONE_HREF}
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 hover:border-ink-400 hover:text-white"
          >
            Call {CONTACT_PHONE}
          </a>
        </div>
        <Link to="/" className="mt-5 inline-block text-sm text-brand-400 hover:underline">
          ← Back to deals
        </Link>
      </div>
    )
  }

  const location = publicLocation(deal.property_address)


  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {deal.is_illiquid && (
        <IlliquidModal
          dealId={deal.id}
          dealTitle={deal.title}
          reason={deal.alert_reason}
          rehabBudget={deal.rehab_budget}
          onCta={() => setInquiryOpen(true)}
        />
      )}
      {inquiryOpen && (
        <InquiryModal
          dealId={deal.id}
          dealTitle={deal.title}
          amount={inquiryAmount}
          onClose={() => {
            setInquiryOpen(false)
            setInquiryAmount(null)
          }}
        />
      )}

      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white">
        ← All deals
      </Link>

      {isAdmin && <QuickEditPanel deal={deal} onSaved={setDeal} />}

      <div className="mb-6 grid grid-cols-[100px_1fr] gap-4 sm:grid-cols-[220px_1fr] sm:gap-5">
        <div className="aspect-square w-full overflow-hidden rounded-xl border border-ink-700/60 bg-ink-800">
          {deal.cover_image_path ? (
            <img
              src={getMediaUrl(deal.cover_image_path)}
              alt={deal.title}
              loading="eager"
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl text-ink-600">🏠</div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{deal.title}</h1>
            <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs font-medium capitalize text-ink-300">
              {deal.status}
            </span>
          </div>
          {location && <p className="text-sm text-ink-400">{location}</p>}
          {deal.is_partnered && (
            <p className="flex items-center gap-1.5 text-sm text-gold-400">
              🤝 Partnered project{deal.partner_name ? ` — owning entity: ${deal.partner_name}` : ''}
            </p>
          )}
          {deal.current_focus && (
            <p className="flex items-center gap-2 text-sm font-medium text-brand-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
              Now: {deal.current_focus}
            </p>
          )}
          <p className="text-xs text-ink-500">Last updated {formatDate(deal.updated_at)}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setInquiryOpen(true)}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
            >
              Partner on this deal
            </button>
            {deal.drive_url && (
              <a
                href={deal.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-ink-400 hover:text-white"
              >
                📁 Photo album ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {deal.raise_target !== null && deal.raise_target > 0 && (
        <div className="mb-3">
          <FundingBar deal={deal} />
        </div>
      )}

      <div className="mb-3">
        <FinancialStrip deal={deal} />
      </div>

      <div className="mb-6">
        <ReservesStrip deal={deal} />
      </div>

      {deal.is_illiquid && (
        <div className="mb-6">
          <AlertBanner reason={deal.alert_reason} onCta={() => setInquiryOpen(true)} />
        </div>
      )}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-ink-900/60 p-1 scrollbar-thin">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'overview' && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-white">Project status</h2>
              <TaskBoard tasks={tasks} />
            </div>

            {deal.before_image_path && deal.after_image_path && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-white">Before & after</h2>
                <BeforeAfterSlider
                  beforeUrl={getMediaUrl(deal.before_image_path)}
                  afterUrl={getMediaUrl(deal.after_image_path)}
                  alt={deal.title}
                />
              </div>
            )}

            {deal.status === 'active' && (
              <PayoffCalculator
                raiseTarget={deal.raise_target}
                onCta={(amount) => {
                  setInquiryAmount(amount)
                  setInquiryOpen(true)
                }}
              />
            )}
          </div>
        )}
        {tab === 'media' && (
          <div className="flex flex-col gap-4">
            {deal.drive_url && (
              <a
                href={deal.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-3 transition-colors hover:bg-brand-500/10"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-lg">
                  📁
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-white">Full photo album on Google Drive</span>
                  <span className="block text-xs text-ink-400">Every photo and video — opens in a new tab</span>
                </span>
                <span className="shrink-0 text-sm text-brand-400">Open ↗</span>
              </a>
            )}
            <MediaGallery dealId={deal.id} />
          </div>
        )}
        {tab === 'info' && <DealInfoTab deal={deal} />}
        {tab === 'invoices' && <DocumentList dealId={deal.id} docType="invoice" />}
      </div>

      <AssetShowcase />
      <ContactCta />
    </div>
  )
}
