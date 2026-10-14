/** The myteam.fans mark: a ball in the team's accent color. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="brand-mark" viewBox="0 0 34 34" width={size} height={size} aria-hidden="true">
      <circle cx="17" cy="17" r="17" fill="var(--sunshine)" />
      <g fill="none" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 2 V32" />
        <path d="M2 17 H32" />
        <path d="M6.5 6.5 C11 11 11 23 6.5 27.5" />
        <path d="M27.5 6.5 C23 11 23 23 27.5 27.5" />
      </g>
    </svg>
  )
}
