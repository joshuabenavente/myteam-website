// Load the JSON files written by scripts/ingest.ts.

import { useEffect, useState } from 'react'
import type {
  AvailabilityFile,
  GameLogsFile,
  HeadToHeadFile,
  MetaFile,
  PlayersFile,
  PreviewsFile,
  ScheduleFile,
  StandingsFile,
} from './types.ts'

export interface AppData {
  schedule: ScheduleFile
  standings: StandingsFile
  h2h: HeadToHeadFile
  players: PlayersFile
  meta: MetaFile
  /** Optional: absent until the first injuries refresh. */
  availability?: AvailabilityFile
  /** Optional: only written when previews are enabled. */
  previews?: PreviewsFile
}

async function load<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`Couldn't load ${name} (HTTP ${res.status})`)
  return res.json() as Promise<T>
}

/** Like load, but a missing or broken optional file just leaves that feature out. */
const loadOptional = <T,>(name: string) => load<T>(name).catch(() => undefined)

const teamFile = (abbr: string, name: string) => `teams/${abbr.toLowerCase()}/${name}`

/** Until a team's player stats have been fetched (teams take turns), show an empty roster. */
const noPlayers = (season: string): PlayersFile => ({
  season,
  lastSeason: '',
  teamGamesPlayed: { regular: 0, playoffs: 0 },
  players: [],
})

/** Shared files (standings, injuries) plus the team's own; reloads when the team changes. */
export function useAppData(abbr: string | undefined): { data?: AppData; error?: string } {
  const [state, setState] = useState<{ abbr?: string; data?: AppData; error?: string }>({})
  useEffect(() => {
    if (!abbr) return
    let stale = false
    Promise.all([
      load<ScheduleFile>(teamFile(abbr, 'schedule')),
      load<StandingsFile>('standings'),
      load<HeadToHeadFile>(teamFile(abbr, 'h2h')).catch(() => ({ season: '', lastSeason: '', opponents: {} })),
      loadOptional<PlayersFile>(teamFile(abbr, 'players')),
      load<MetaFile>('meta'),
      loadOptional<AvailabilityFile>('availability'),
      loadOptional<PreviewsFile>(teamFile(abbr, 'previews')),
    ])
      .then(([schedule, standings, h2h, players, meta, availability, previews]) => {
        if (stale) return
        setState({
          abbr,
          data: { schedule, standings, h2h, players: players ?? noPlayers(schedule.season), meta, availability, previews },
        })
      })
      .catch((err: Error) => !stale && setState({ abbr, error: err.message }))
    return () => {
      stale = true
    }
  }, [abbr])
  // Don't show one team's data under another's address while the new team loads.
  return state.abbr === abbr ? { data: state.data, error: state.error } : {}
}

const gameLogs = new Map<string, Promise<GameLogsFile | undefined>>()

/** Game logs are only needed on player pages, so they load on first use. */
export function useGameLogs(abbr: string): GameLogsFile | undefined {
  const [logs, setLogs] = useState<{ abbr: string; file?: GameLogsFile }>()
  useEffect(() => {
    if (!gameLogs.has(abbr)) gameLogs.set(abbr, loadOptional<GameLogsFile>(teamFile(abbr, 'gamelogs')))
    gameLogs.get(abbr)!.then((file) => setLogs({ abbr, file }))
  }, [abbr])
  return logs?.abbr === abbr ? logs.file : undefined
}
