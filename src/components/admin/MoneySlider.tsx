import { formatCurrency } from '../../lib/format'

// A $1,000-per-notch slider that makes updating money fields actually fun.
// Optional `compareTo` drives the emoji mood (e.g. spent vs budget).
export default function MoneySlider({
  label,
  value,
  onChange,
  max = 200000,
  step = 1000,
  compareTo,
  compareMode = 'spend',
  accent = 'brand',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
  step?: number
  compareTo?: number | null
  compareMode?: 'spend' | 'raise'
  accent?: 'brand' | 'gold'
}) {
  const pct = compareTo && compareTo > 0 ? value / compareTo : null

  let mood = ''
  if (pct !== null) {
    if (compareMode === 'spend') {
      mood = pct === 0 ? '🧊 untouched' : pct <= 0.5 ? '🟢 cruising' : pct <= 0.85 ? '🟡 tightening' : pct <= 1 ? '😅 to the wire' : '🔥 over budget!'
    } else {
      mood =
        pct === 0
          ? '🌱 just opened'
          : pct < 0.5
            ? '🚀 building'
            : pct < 1
              ? '⚡ almost there'
              : '🎉 fully funded!'
    }
  }

  const fillPct = Math.min((value / max) * 100, 100)
  const barColor = accent === 'gold' ? 'var(--color-gold-400)' : 'var(--color-brand-400)'

  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-800/50 px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink-400">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-white">
          {formatCurrency(value)}
          {mood && <span className="ml-2 text-xs font-normal text-ink-400">{mood}</span>}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label} by $1,000`}
          onClick={() => onChange(Math.max(0, value - step))}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-ink-600 text-sm text-ink-300 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={Math.min(value, max)}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right, ${barColor} ${fillPct}%, var(--color-ink-700) ${fillPct}%)`,
            accentColor: barColor,
          }}
        />
        <button
          type="button"
          aria-label={`Increase ${label} by $1,000`}
          onClick={() => onChange(value + step)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-ink-600 text-sm text-ink-300 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
        >
          +
        </button>
      </div>
      <p className="mt-1 text-right text-[10px] text-ink-600">$1k per notch</p>
    </div>
  )
}
