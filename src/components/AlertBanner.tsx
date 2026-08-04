export default function AlertBanner({ reason, onCta }: { reason: string | null; onCta: () => void }) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-alert-500/30 bg-gradient-to-r from-alert-500/10 to-transparent px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-alert-500" />
        <p className="text-sm text-ink-200">
          <span className="font-semibold text-alert-400">Red alert:</span>{' '}
          {reason || 'Illiquid project'} — this deal is paused pending funding.
        </p>
      </div>
      <button
        onClick={onCta}
        className="shrink-0 whitespace-nowrap rounded-lg border border-alert-500/40 px-3 py-1.5 text-xs font-semibold text-alert-300 transition-colors hover:bg-alert-500/10 cursor-pointer"
      >
        I can help fund this →
      </button>
    </div>
  )
}
