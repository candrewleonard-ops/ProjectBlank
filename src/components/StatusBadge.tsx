import type { TaskStatus } from '../lib/types'

const STYLES: Record<TaskStatus, string> = {
  todo: 'bg-ink-700 text-ink-200 border-ink-600',
  complete: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  red_alert: 'bg-alert-500/15 text-alert-400 border-alert-500/30',
}

const LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  complete: 'Complete',
  red_alert: 'Red alert',
}

export default function StatusBadge({ status, className = '' }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]} ${className}`}
    >
      {status === 'red_alert' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-alert-400" />}
      {LABELS[status]}
    </span>
  )
}
