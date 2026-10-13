// Shapes of the JSON files in public/data, written by scripts/ingest.ts and read by the app.

import type { GameType } from './season.ts'

export type TrackedGameType = Exclude<GameType, 'excluded'>

export interface Broadcast {
  name: string
  /** National broadcasts reach everyone; local ones are Denver's regional TV/streaming. */
  scope: 'national' | 'local'
  kind: 'tv' | 'stream'
}

export interface Game {
  /** NBA game ID. */
  id: string
  type: TrackedGameType
  /** ISO timestamp in UTC; formatted in the viewer's time zone by the app. */
  startUtc: string
  home: boolean
  opponent: string
  status: 'scheduled' | 'live' | 'final'
  /** Present once the game has started. */
  score?: { team: number; opponent: number }
  broadcasts: Broadcast[]
  /** Tip-off time not announced yet (startUtc holds the date only). */
  timeTbd?: boolean
  /** Extra context from the schedule, e.g. "Emirates NBA Cup" or "West First Round - Game 3". */
  label?: string
}

export interface ScheduleFile {
  season: string
  games: Game[]
}

export interface TeamInfo {
  abbr: string
  conference: 'East' | 'West'
  division: string
  wins: number
  losses: number
  /** 1 = division leader. */
  divisionRank: number
  conferenceRank: number
  /** Games behind the division leader. */
  divisionGamesBehind: number
  /** e.g. "W3"; absent before the first game. */
  streak?: string
}

export interface StandingsFile {
  season: string
  teams: Record<string, TeamInfo>
}

export interface WinLoss {
  wins: number
  losses: number
}

export interface HeadToHead {
  regular: WinLoss
  playoffs: WinLoss
}

export interface HeadToHeadFile {
  season: string
  lastSeason: string
  /** Keyed by opponent abbreviation. */
  opponents: { [abbr: string]: { current: HeadToHead; last: HeadToHead } }
}

/** Counting totals; the app derives per-game averages and percentages. */
export interface StatTotals {
  games: number
  started: number
  minutes: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  threeMade: number
  threeAttempted: number
  ftMade: number
  ftAttempted: number
}

export type SplitStats = { [K in TrackedGameType]?: StatTotals }

export interface Player {
  /** basketball-reference player ID, e.g. "jokicni01". */
  id: string
  name: string
  number?: string
  position: string
  /** On a two-way contract. */
  twoWay: boolean
  current: SplitStats
  /** All of last season. */
  lastFull: SplitStats
  /** Last season through the same number of team games Denver has played this season. */
  lastToDate: SplitStats
}

export interface PlayersFile {
  season: string
  lastSeason: string
  /** Denver's games played this season, by type; the cutoff for lastToDate. */
  teamGamesPlayed: { [K in TrackedGameType]: number }
  players: Player[]
}

export interface MetaFile {
  updatedAt: string
  season: string
  sources: string[]
}
