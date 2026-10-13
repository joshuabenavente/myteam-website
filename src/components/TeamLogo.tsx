import { useState } from 'react'
import { teamLogoUrl } from '../lib/teams.ts'

/** Team logo, falling back to the abbreviation if the image can't load. */
export function TeamLogo({ abbr, size = 28 }: { abbr: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className="logo-fallback" style={{ width: size, height: size }} aria-hidden="true">
        {abbr}
      </span>
    )
  }
  return (
    <img
      className="logo"
      src={teamLogoUrl(abbr)}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
