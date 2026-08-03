import type { DealTask, TaskStatus } from '../lib/types'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'complete', label: 'Complete' },
  { status: 'todo', label: 'To do' },
  { status: 'red_alert', label: 'Red alerts' },
]

export default function TaskBoard({ tasks }: { tasks: DealTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-700 py-10 text-center text-sm text-ink-500">
        No milestones posted yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.status)
        return (
          <div key={col.status} className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">{col.label}</h3>
              <span className="rounded-full bg-ink-800 px-1.5 py-0.5 text-xs text-ink-400">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.length === 0 && <p className="px-1 text-xs text-ink-600">Nothing here</p>}
              {items.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    task.status === 'red_alert'
                      ? 'border-alert-500/30 bg-alert-500/5'
                      : 'border-ink-700/60 bg-ink-800/60'
                  }`}
                >
                  <p className="text-ink-100">{task.title}</p>
                  {task.status === 'red_alert' && task.alert_reason && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-alert-400">{task.alert_reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
