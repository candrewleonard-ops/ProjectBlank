import { useRef, useState } from 'react'

// Drag the handle to reveal before vs after. Pure pointer events, no deps.
export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  alt = '',
}: {
  beforeUrl: string
  afterUrl: string
  alt?: string
}) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function updateFromClientX(clientX: number) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(98, Math.max(2, pct)))
  }

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] w-full touch-none select-none overflow-hidden rounded-xl border border-ink-700/60"
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        updateFromClientX(e.clientX)
      }}
      onPointerMove={(e) => {
        if (dragging.current) updateFromClientX(e.clientX)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setPos((p) => Math.max(2, p - 4))
        if (e.key === 'ArrowRight') setPos((p) => Math.min(98, p + 4))
      }}
    >
      <img src={afterUrl} alt={alt ? `${alt} — after` : 'After'} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={beforeUrl}
          alt={alt ? `${alt} — before` : 'Before'}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          style={{ width: ref.current ? `${ref.current.getBoundingClientRect().width}px` : '100%', maxWidth: 'none' }}
        />
      </div>

      <div
        className="absolute inset-y-0 z-10 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)]"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm text-ink-950 shadow-lg">
          ↔
        </span>
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
        Before
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-brand-500/90 px-2.5 py-1 text-xs font-semibold text-ink-950 backdrop-blur">
        After
      </span>
    </div>
  )
}
