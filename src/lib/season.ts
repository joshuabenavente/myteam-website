// Season and game-type helpers shared by the data scripts and the frontend.

export interface Season {
  /** Calendar year the season starts in, e.g. 2026 for 2026-27. */
  startYear: number
  /** NBA stats API label, e.g. "2026-27". */
  label: string
  /** Year basketball-reference and ESPN use for the season (the end year), e.g. 2027. */
  endYear: number
}

export function seasonFromStartYear(startYear: number): Season {
  const endYear = startYear + 1
  return { startYear, endYear, label: `${startYear}-${String(endYear).slice(-2)}` }
}

/** The season a date belongs to. Seasons roll over on August 1 (after the Finals and draft). */
export function seasonForDate(date: Date): Season {
  const year = date.getUTCFullYear()
  return seasonFromStartYear(date.getUTCMonth() >= 7 ? year : year - 1)
}

export function previousSeason(season: Season): Season {
  return seasonFromStartYear(season.startYear - 1)
}

/** Only regular season and playoffs are tracked; preseason, play-in, All-Star and the Cup final are excluded. */
export type GameType = 'regular' | 'playoffs' | 'excluded'

/** Classify an NBA game by its 10-digit ID, whose first three digits encode the season type. */
export function gameTypeFromNbaId(gameId: string): GameType {
  switch (gameId.slice(0, 3)) {
    case '002':
      return 'regular'
    case '004':
      return 'playoffs'
    default:
      // 001 preseason, 003 All-Star, 005 play-in, 006 NBA Cup final
      return 'excluded'
  }
}
