import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { DealTask, TaskStatus } from '../../lib/types'
import StatusBadge from '../StatusBadge'
import Spinner from '../Spinner'

export default function AdminTaskManager({ dealId }: { dealId: string }) {
  const [tasks, setTasks] = useState<DealTask[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    load()
  }, [dealId])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('deal_tasks').select('*').eq('deal_id', dealId).order('position')
    setTasks((data ?? []) as DealTask[])
    setLoading(false)
  }

  async function addTask(e: FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    const { error } = await supabase.from('deal_tasks').insert({
      deal_id: dealId,
      title: newTitle.trim(),
      status: 'todo',
      position: tasks.length,
    })
    setAdding(false)
    if (!error) {
      setNewTitle('')
      load()
    }
  }

  async function updateTask(task: DealTask, patch: Partial<DealTask>) {
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, ...patch } : t)))
    await supabase.from('deal_tasks').update(patch).eq('id', task.id)
  }

  async function deleteTask(task: DealTask) {
    if (!confirm(`Remove "${task.title}"?`)) return
    setTasks((ts) => ts.filter((t) => t.id !== task.id))
    await supabase.from('deal_tasks').delete().eq('id', task.id)
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-white">Project status board</h2>

      {loading ? (
        <Spinner full={false} />
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.length === 0 && <p className="text-sm text-ink-500">No milestones yet.</p>}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-2 rounded-lg border border-ink-700/60 bg-ink-900/40 p-3 sm:flex-row sm:items-center"
            >
              <input
                value={task.title}
                onChange={(e) => setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, title: e.target.value } : t)))}
                onBlur={(e) => updateTask(task, { title: e.target.value })}
                className="flex-1 rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-sm text-white outline-none focus:border-brand-500"
              />
              <div className="flex items-center gap-2">
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task, { status: e.target.value as TaskStatus })}
                  className="rounded-md border border-ink-600 bg-ink-800 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-500"
                >
                  <option value="todo">To do</option>
                  <option value="complete">Complete</option>
                  <option value="red_alert">Red alert</option>
                </select>
                <StatusBadge status={task.status} />
                <button
                  onClick={() => deleteTask(task)}
                  className="rounded-md px-2 py-1 text-xs text-ink-500 hover:text-alert-400 cursor-pointer"
                  aria-label="Delete task"
                >
                  ✕
                </button>
              </div>
              {task.status === 'red_alert' && (
                <input
                  placeholder="Reason (e.g. Illiquid Project)"
                  value={task.alert_reason ?? ''}
                  onChange={(e) => setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, alert_reason: e.target.value } : t)))}
                  onBlur={(e) => updateTask(task, { alert_reason: e.target.value })}
                  className="w-full rounded-md border border-alert-500/30 bg-ink-800 px-2.5 py-1.5 text-sm text-white outline-none focus:border-alert-500 sm:w-56"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addTask} className="mt-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a milestone, e.g. Permits approved"
          className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-lg border border-ink-600 px-3 py-2 text-sm font-medium text-ink-200 hover:border-ink-400 hover:text-white disabled:opacity-60 cursor-pointer"
        >
          Add
        </button>
      </form>
    </section>
  )
}
