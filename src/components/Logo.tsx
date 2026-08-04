// SVG recreation of the Re-Innovation Homes mark: a roofline over "Re",
// with the stacked INNOVATION / HOMES wordmark beside it.

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M8 33 L32 12 L56 33"
        fill="none"
        stroke="var(--color-brand-400)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="32"
        y="55"
        textAnchor="middle"
        fontWeight="800"
        fontSize="31"
        fill="currentColor"
        fontFamily="inherit"
      >
        Re
      </text>
    </svg>
  )
}

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 text-white ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col text-left leading-[1.15]">
        <span className="text-[13px] font-extrabold tracking-[0.22em]">INNOVATION</span>
        <span className="text-[13px] font-extrabold tracking-[0.42em] text-brand-400">HOMES</span>
      </span>
    </span>
  )
}
