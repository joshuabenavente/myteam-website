// Live scores from ESPN's public scoreboard, fetched by the browser during the team's games. The
// hourly data refresh is far too slow for a score, and ESPN's scoreboard allows cross-site reads
// (the NBA's live feed doesn't).

import { createContext, useContext } from 'react'
import { STALE_MS, type LiveScore } from './scoreboard.ts'

export * from './scoreboard.ts'

export interface LiveStatus {
  /** The schedule game being watched; undefined in test mode. */
  gameId?: string
  /** The team being watched (the site's team, or the ?live= team). */
  team: string
  score?: LiveScore
  /** When the score was last fetched successfully, and last tried (ms). */
  updatedAt?: number
  checkedAt?: number
  /** The last fetch failed. */
  failed: boolean
}

/** Minutes since the last good update, when it's old enough to call stale. */
export function staleMinutes(live: Pick<LiveStatus, 'updatedAt' | 'checkedAt'>): number | undefined {
  if (live.updatedAt === undefined || live.checkedAt === undefined) return undefined
  const age = live.checkedAt - live.updatedAt
  return age > STALE_MS ? Math.round(age / 60_000) : undefined
}

/** What a schedule game should show from the live score, if it's the one being watched. */
export function liveFor(live: LiveStatus | undefined, gameId: string): LiveScore | undefined {
  return live?.gameId === gameId ? live.score : undefined
}

export const LiveContext = createContext<LiveStatus | undefined>(undefined)
export const useLive = () => useContext(LiveContext)
