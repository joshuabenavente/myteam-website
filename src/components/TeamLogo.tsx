import { useState } from 'react'
import { teamLogoUrl } from '../lib/teams.ts'

interface Props {
  abbr: string
  size?: number
  /** "auto" follows the color scheme; "dark" is for elements that are always dark (the player hero). */
  background?: 'auto' | 'dark'
}

/** Team logo, falling back to the abbreviation if the image can't load. */
export function TeamLogo({ abbr, size = 28, background = 'auto' }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className="logo-fallback" style={{ width: size, height: size }} aria-hidden="true">
        {abbr}
      </span>
    )
  }
  const img = (
    <img
      className="logo"
      src={teamLogoUrl(abbr, background === 'dark')}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
  if (background === 'dark') return img
  // Dark-colored logos (e.g. New Orleans) disappear on the dark theme without the dark variant.
  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={teamLogoUrl(abbr, true)} />
      {img}
    </picture>
  )
}
