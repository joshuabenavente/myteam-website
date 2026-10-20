import { useEffect, useState } from 'react'
import {
  espnDate,
  parseScoreboardGames,
  POLL_MS,
  scoreboardUrl,
  WINDOW_AFTER_MS,
  WINDOW_BEFORE_MS,
  type LiveScore,
} from './scoreboard.ts'
import type { DayGame } from './types.ts'

/** setTimeout misfires for very long delays; wake up at least this often and re-check. */
const MAX_WAIT_MS = 6 * 60 * 60 * 1000

/**
 * Live scores for a day's games from ESPN's scoreboard: one request per scoreboard date (usually
 * one) every 30 seconds while any game is in its live window and not over. Polls only while the
 * page is visible, like the team pages.
 */
export function useDayScores(games: DayGame[]): LiveScore[] {
  const [scores, setScores] = useState<LiveScore[]>([])
  // The games as a string, so the polling restarts only when they change, not on every render.
  const key = games.map((g) => [g.id, g.startUtc, g.home, g.away, g.status].join('|')).join(',')

  useEffect(() => {
    const watched = key
      ? key.split(',').map((g) => {
          const [id, startUtc, home, away, status] = g.split('|')
          return { id, startUtc, home, away, status }
        })
      : []
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finals = new Set<string>()

    const run = async () => {
      clearTimeout(timer)
      if (stopped) return
      const now = Date.now()
      const open = watched.filter((g) => {
        const start = Date.parse(g.startUtc)
        return g.status !== 'final' && !finals.has(g.id) && now >= start - WINDOW_BEFORE_MS && now <= start + WINDOW_AFTER_MS
      })
      if (open.length === 0) {
        // Nothing on now: wait for the next game's window, if there is one today.
        const next = watched
          .filter((g) => g.status !== 'final' && Date.parse(g.startUtc) - WINDOW_BEFORE_MS > now)
          .map((g) => Date.parse(g.startUtc) - WINDOW_BEFORE_MS)
          .sort((a, b) => a - b)[0]
        if (next !== undefined) timer = setTimeout(run, Math.min(next - now, MAX_WAIT_MS))
        return
      }
      if (document.visibilityState === 'hidden') return
      const dates = [...new Set(open.map((g) => espnDate(g.startUtc)))]
      const results = await Promise.all(
        dates.map((d) =>
          fetch(scoreboardUrl(open.find((g) => espnDate(g.startUtc) === d)!.startUtc), {
            cache: 'no-store',
            signal: AbortSignal.timeout(10_000),
          })
            .then((res) => (res.ok ? res.json() : undefined))
            .then((json) => (json ? parseScoreboardGames(json) : []))
            .catch(() => [] as LiveScore[]),
        ),
      )
      if (stopped) return
      const fresh = results.flat()
      for (const g of open) {
        const s = fresh.find((x) => x.home.abbr === g.home && x.away.abbr === g.away)
        if (s?.state === 'final' || s?.state === 'postponed') finals.add(g.id)
      }
      // Keep earlier scores (games already over) alongside the new ones.
      setScores((old) => [...old.filter((o) => !fresh.some((f) => f.home.abbr === o.home.abbr && f.away.abbr === o.away.abbr)), ...fresh])
      timer = setTimeout(run, POLL_MS)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void run()
    }
    document.addEventListener('visibilitychange', onVisibility)
    void run()
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [key])

  return scores
}
