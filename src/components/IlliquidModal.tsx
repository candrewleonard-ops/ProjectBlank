import { useEffect, useState } from 'react'
import { CONTACT_HREF } from '../lib/site'

export default function IlliquidModal({
  dealId,
  dealTitle,
  reason,
}: {
  dealId: string
  dealTitle: string
  reason: string | null
}) {
  const storageKey = `illiquid-dismissed-${dealId}`
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(storageKey)) return
    const t = setTimeout(() => {
      setOpen(true)
      requestAnimationFrame(() => setVisible(true))
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId])

  function close() {
    setVisible(false)
    sessionStorage.setItem(storageKey, '1')
    setTimeout(() => setOpen(false), 200)
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="illiquid-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-alert-500/30 bg-ink-900 shadow-2xl shadow-black/50 transition-all duration-200 ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
        }`}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-alert-600 via-gold-500 to-alert-600" />

        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-5 grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white cursor-pointer"
        >
          ✕
        </button>

        <div className="px-6 pb-6 pt-7">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-alert-500/15 ring-8 ring-alert-500/5">
            <span className="text-2xl">⚠️</span>
          </div>

          <h2 id="illiquid-modal-title" className="text-center text-lg font-semibold text-white">
            {dealTitle} needs a boost
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-ink-400">
            This project is currently paused —{' '}
            <span className="font-medium text-alert-400">{reason || 'Illiquid Project'}</span>. A
            quick injection of capital gets it back on track and moving toward completion.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <a
              href={CONTACT_HREF}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              Contact us about financing
            </a>
            <button
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-400 transition-colors hover:text-white cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
