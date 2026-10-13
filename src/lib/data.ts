// Load the JSON files written by scripts/ingest.ts.

import { useEffect, useState } from 'react'
import type { HeadToHeadFile, MetaFile, PlayersFile, ScheduleFile, StandingsFile } from './types.ts'

export interface AppData {
  schedule: ScheduleFile
  standings: StandingsFile
  h2h: HeadToHeadFile
  players: PlayersFile
  meta: MetaFile
}

async function load<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`Couldn't load ${name} (HTTP ${res.status})`)
  return res.json() as Promise<T>
}

export function useAppData(): { data?: AppData; error?: string } {
  const [state, setState] = useState<{ data?: AppData; error?: string }>({})
  useEffect(() => {
    Promise.all([
      load<ScheduleFile>('schedule'),
      load<StandingsFile>('standings'),
      load<HeadToHeadFile>('h2h'),
      load<PlayersFile>('players'),
      load<MetaFile>('meta'),
    ])
      .then(([schedule, standings, h2h, players, meta]) => setState({ data: { schedule, standings, h2h, players, meta } }))
      .catch((err: Error) => setState({ error: err.message }))
  }, [])
  return state
}
