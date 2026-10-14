import { useEffect, useState } from 'react'
import {
  parseScoreboard,
  POLL_MS,
  scoreboardUrl,
  WINDOW_AFTER_MS,
  WINDOW_BEFORE_MS,
  type LiveScore,
  type LiveStatus,
} from './live.ts'

/** setTimeout misfires for delays over ~24.8 days; wake up at least this often and re-check. */
const MAX_WAIT_MS = 6 * 60 * 60 * 1000

interface State {
  key: string
  score?: LiveScore
  updatedAt?: number
  checkedAt?: number
  failed: boolean
}

/**
 * Poll ESPN's scoreboard for `team`'s game while it's in its live window (or always, without a
 * start time, for the ?live= test mode). Polls only while the page is visible and stops at the final.
 */
export function useLiveScore(team?: string, startUtc?: string, gameId?: string): LiveStatus | undefined {
  const key = team ? `${team}|${startUtc ?? 'now'}` : ''
  const [state, setState] = useState<State>()

  useEffect(() => {
    if (!team) return
    let stopped = false
    let done = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const start = startUtc ? Date.parse(startUtc) : undefined

    const run = async () => {
      clearTimeout(timer)
      if (stopped || done) return
      const now = Date.now()
      if (start !== undefined) {
        const opens = start - WINDOW_BEFORE_MS
        if (now < opens) {
          timer = setTimeout(run, Math.min(opens - now, MAX_WAIT_MS))
          return
        }
        if (now > start + WINDOW_AFTER_MS) return
      }
      // Hidden tabs don't poll; the visibility listener picks it back up.
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch(scoreboardUrl(startUtc), { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const score = parseScoreboard(await res.json(), team)
        if (stopped) return
        const at = Date.now()
        setState({ key, score, updatedAt: at, checkedAt: at, failed: false })
        if (score?.state === 'final' || score?.state === 'postponed') done = true
      } catch {
        if (stopped) return
        setState((s) => ({ ...(s?.key === key ? s : { key }), checkedAt: Date.now(), failed: true }))
      }
      if (!done) timer = setTimeout(run, POLL_MS)
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
  }, [key, team, startUtc])

  if (!team) return undefined
  const current = state?.key === key ? state : undefined
  return {
    gameId,
    team,
    score: current?.score,
    updatedAt: current?.updatedAt,
    checkedAt: current?.checkedAt,
    failed: current?.failed ?? false,
  }
}
