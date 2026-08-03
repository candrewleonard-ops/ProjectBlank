export default function Spinner({ full }: { full?: boolean }) {
  const spinner = (
    <div
      className="h-6 w-6 animate-spin rounded-full border-2 border-ink-600 border-t-brand-400"
      role="status"
      aria-label="Loading"
    />
  )

  if (!full) return spinner

  return <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>
}
