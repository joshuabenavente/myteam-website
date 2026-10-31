// Load the JSON files written by scripts/ingest.ts.

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AvailabilityFile,
  GameLogsFile,
  HeadToHeadFile,
  LastSeasonFile,
  LeagueFile,
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
  /** Last season's results; absent until the data refresh has written them. */
  lastSeason?: LastSeasonFile
  /** League-wide facts for the matchup tags; absent until the data refresh has written them. */
  league?: LeagueFile
  /** No connection: the installed app is showing the copy it saved last time. */
  offline?: boolean
}

/** Set when the service worker answers with a saved copy because the network is down. */
let servedOffline = false
/** A refresh (pull to refresh) checks with the server rather than taking the browser's cached copy. */
let revalidate = false

async function load<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, revalidate ? { cache: 'no-cache' } : undefined)
  if (!res.ok) throw new Error(`Couldn't load ${name} (HTTP ${res.status})`)
  if (res.headers.get('X-Myteam-Offline')) servedOffline = true
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

/**
 * Shared files (standings, injuries) plus the team's own; reloads when the team changes, and on
 * `refresh()`, which resolves once the new data (or a failure) is in.
 */
export function useAppData(abbr: string | undefined): { data?: AppData; error?: string; refresh: () => Promise<void> } {
  const [state, setState] = useState<{ abbr?: string; data?: AppData; error?: string }>({})
  const [version, setVersion] = useState(0)
  const waiting = useRef<(() => void)[]>([])
  useEffect(() => {
    if (!abbr) return
    let stale = false
    servedOffline = false
    revalidate = version > 0
    const settled = () => waiting.current.splice(0).forEach((resolve) => resolve())
    Promise.all([
      load<ScheduleFile>(teamFile(abbr, 'schedule')),
      load<StandingsFile>('standings'),
      load<HeadToHeadFile>(teamFile(abbr, 'h2h')).catch(() => ({ season: '', lastSeason: '', opponents: {} })),
      loadOptional<PlayersFile>(teamFile(abbr, 'players')),
      load<MetaFile>('meta'),
      loadOptional<AvailabilityFile>('availability'),
      loadOptional<PreviewsFile>(teamFile(abbr, 'previews')),
      loadOptional<LastSeasonFile>(teamFile(abbr, 'last-season')),
      loadOptional<LeagueFile>('league'),
    ])
      .then(([schedule, standings, h2h, players, meta, availability, previews, lastSeason, league]) => {
        if (stale) return
        setState({
          abbr,
          data: {
            schedule,
            standings,
            h2h,
            players: players ?? noPlayers(schedule.season),
            meta,
            availability,
            previews,
            lastSeason,
            league,
            offline: servedOffline,
          },
        })
        settled()
      })
      .catch((err: Error) => {
        if (stale) return
        // fetch() rejects (rather than answering with an error) when there's no connection.
        const message =
          err instanceof TypeError
            ? "Couldn't reach myteam.fans. You may be offline, and this team hasn't been saved on this device yet."
            : err.message
        // A failed refresh keeps what's on screen.
        setState((s) => (s.abbr === abbr && s.data ? s : { abbr, error: message }))
        settled()
      })
    return () => {
      stale = true
    }
  }, [abbr, version])
  const refresh = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiting.current.push(resolve)
        setVersion((v) => v + 1)
      }),
    [],
  )
  // Don't show one team's data under another's address while the new team loads.
  return state.abbr === abbr ? { data: state.data, error: state.error, refresh } : { refresh }
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

const playerFiles = new Map<string, Promise<PlayersFile | undefined>>()

/** Another team's players (the opponent on a game page), loaded on first use; undefined until then. */
export function usePlayersFile(abbr: string | undefined): PlayersFile | undefined {
  const [loaded, setLoaded] = useState<{ abbr: string; file?: PlayersFile }>()
  useEffect(() => {
    if (!abbr) return
    if (!playerFiles.has(abbr)) playerFiles.set(abbr, loadOptional<PlayersFile>(teamFile(abbr, 'players')))
    let stale = false
    playerFiles.get(abbr)!.then((file) => !stale && setLoaded({ abbr, file }))
    return () => {
      stale = true
    }
  }, [abbr])
  return loaded && loaded.abbr === abbr ? loaded.file : undefined
}
