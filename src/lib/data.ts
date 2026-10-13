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

export function useAppData(): { data?: AppData; error?: string } {
  const [state, setState] = useState<{ data?: AppData; error?: string }>({})
  useEffect(() => {
    Promise.all([
      load<ScheduleFile>('schedule'),
      load<StandingsFile>('standings'),
      load<HeadToHeadFile>('h2h'),
      load<PlayersFile>('players'),
      load<MetaFile>('meta'),
      loadOptional<AvailabilityFile>('availability'),
      loadOptional<PreviewsFile>('previews'),
    ])
      .then(([schedule, standings, h2h, players, meta, availability, previews]) =>
        setState({ data: { schedule, standings, h2h, players, meta, availability, previews } }),
      )
      .catch((err: Error) => setState({ error: err.message }))
  }, [])
  return state
}

let gameLogs: Promise<GameLogsFile | undefined> | undefined

/** Game logs are only needed on player pages, so they load on first use. */
export function useGameLogs(): GameLogsFile | undefined {
  const [logs, setLogs] = useState<GameLogsFile>()
  useEffect(() => {
    gameLogs ??= loadOptional<GameLogsFile>('gamelogs')
    gameLogs.then(setLogs)
  }, [])
  return logs
}
