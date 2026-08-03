export default function ConfigNotice() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-500/15 text-2xl">⚙️</div>
      <h1 className="text-xl font-semibold text-white">Supabase isn't configured yet</h1>
      <p className="text-sm leading-relaxed text-ink-400">
        Create a <code className="rounded bg-ink-800 px-1.5 py-0.5 text-ink-200">.env</code> file
        from <code className="rounded bg-ink-800 px-1.5 py-0.5 text-ink-200">.env.example</code>{' '}
        with your Supabase project URL and anon key, then restart the dev server. See the README
        for full setup instructions.
      </p>
    </div>
  )
}
