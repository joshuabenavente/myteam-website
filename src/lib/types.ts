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
  home: WinLoss
  road: WinLoss
  lastTen: WinLoss
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

export interface PlayerBio {
  /** e.g. 6' 11" */
  height?: string
  /** Pounds. */
  weight?: number
  /** YYYY-MM-DD */
  birthDate?: string
  /** NBA seasons before this one; 0 for rookies. */
  experience?: number
  college?: string
  birthPlace?: string
}

export interface Player {
  /** basketball-reference player ID, e.g. "jokicni01". */
  id: string
  name: string
  number?: string
  position: string
  /** On a two-way contract. */
  twoWay: boolean
  bio: PlayerBio
  /** Transparent cut-out photo (ESPN). */
  headshot?: string
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

/** One game in a player's log. */
export interface GameLogEntry {
  /** The player's team's game number in the season (or playoffs). */
  teamGame: number
  /** YYYY-MM-DD */
  date: string
  opponent: string
  home: boolean
  result: 'W' | 'L'
  /** Team score first, e.g. "133-111" or "131-137 (OT)". */
  score: string
  started: boolean
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

export type GameLog = { [K in TrackedGameType]: GameLogEntry[] }

export interface GameLogsFile {
  season: string
  lastSeason: string
  /** Keyed by player ID. */
  players: { [id: string]: { current: GameLog; last: GameLog } }
}

export interface Absence {
  name: string
  /** ESPN status, e.g. "Out" or "Day-To-Day". */
  status: string
  /** Listed as a game-time decision. */
  gameTimeDecision: boolean
  /** e.g. "Knee (tendinitis)", "Rest", "Personal". */
  reason?: string
  /** Expected return date (YYYY-MM-DD), when reported. */
  returnDate?: string
}

export interface AvailabilityFile {
  /** When the list last changed. */
  updatedAt: string
  /** Keyed by team abbreviation. */
  teams: { [abbr: string]: Absence[] }
}

export interface Preview {
  text: string
  generatedAt: string
  /** Hash of the facts the preview was written from; it's rewritten when they change. */
  factsHash: string
}

export interface PreviewsFile {
  /** Keyed by game ID; only the next few games. */
  games: { [gameId: string]: Preview }
}

export interface MetaFile {
  updatedAt: string
  season: string
  sources: string[]
}
