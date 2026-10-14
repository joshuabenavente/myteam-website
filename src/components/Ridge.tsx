import { useTeam } from '../lib/team.ts'

/**
 * The faint pattern along the bottom of a navy panel: Denver's two mountain ridges, or court
 * lines (the three-point arc and the lane) for every other team and the team picker.
 */
export function Ridge({ court }: { court?: boolean }) {
  const team = useTeam()
  if (court || team.abbr !== 'DEN') return <CourtLines />
  return (
    <svg className="header-ridge" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 110 L90 70 L170 95 L270 40 L360 85 L450 55 L560 100 L660 45 L760 90 L860 60 L960 95 L1060 50 L1140 80 L1200 65 L1200 140 L0 140 Z"
        fill="rgb(255 255 255 / 5%)"
      />
      <path
        d="M0 125 L120 95 L230 118 L330 82 L440 112 L540 92 L650 120 L760 88 L880 115 L990 90 L1100 116 L1200 98 L1200 140 L0 140 Z"
        fill="rgb(254 197 36 / 10%)"
      />
    </svg>
  )
}

function CourtLines() {
  return (
    <svg className="header-ridge court" viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="none" strokeWidth="3">
        <path d="M250 140 L250 118 A350 350 0 0 1 950 118 L950 140" stroke="rgb(255 255 255 / 5%)" />
        <path d="M500 140 V40 H700 V140" stroke="rgb(255 255 255 / 5%)" />
        <path d="M500 40 A100 100 0 0 1 700 40" stroke="color-mix(in srgb, var(--sunshine) 12%, transparent)" />
      </g>
    </svg>
  )
}
