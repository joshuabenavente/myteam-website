import { useEffect, useState } from 'react'
import { parseSummary, summaryUrl, type GameSummary } from './gameSummary.ts'
import { parseScoreboard, scoreboardUrl, WINDOW_AFTER_MS, WINDOW_BEFORE_MS } from './live.ts'

/** The game page refreshes a little faster than the header's score. */
const POLL_MS = 20 * 1000

export interface SummaryStatus {
  summary?: GameSummary
  updatedAt?: number
  checkedAt?: number
  /** The last request failed. */
  failed: boolean
  /** ESPN has no game for this team on that date. */
  notFound: boolean
}

interface State extends SummaryStatus {
  key: string
}

/**
 * Load ESPN's summary for `team`'s game on `startUtc`'s date (today's, without one), and keep it
 * fresh every 20 seconds while the game is on and the page is visible. Finished and far-off games
 * are fetched once.
 */
export function useGameSummary(team: string, startUtc?: string): SummaryStatus {
  const key = `${team}|${startUtc ?? 'now'}`
  const [state, setState] = useState<State>()

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let eventId: string | undefined
    let done = false
    const start = startUtc ? Date.parse(startUtc) : undefined
    const inWindow = (now: number) =>
      start === undefined || (now >= start - WINDOW_BEFORE_MS && now <= start + WINDOW_AFTER_MS)

    const run = async () => {
      clearTimeout(timer)
      if (stopped || done || document.visibilityState === 'hidden') return
      try {
        if (!eventId) {
          const res = await fetch(scoreboardUrl(startUtc), { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          eventId = parseScoreboard(await res.json(), team)?.eventId
          if (!eventId) {
            if (!stopped) setState({ key, failed: false, notFound: true, checkedAt: Date.now() })
            return
          }
        }
        const res = await fetch(summaryUrl(eventId), { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const summary = parseSummary(await res.json())
        if (stopped) return
        const at = Date.now()
        setState({ key, summary, updatedAt: at, checkedAt: at, failed: false, notFound: false })
        if (!summary || summary.state === 'final' || summary.state === 'postponed') done = true
      } catch {
        if (stopped) return
        setState((s) => ({ ...(s?.key === key ? s : { key, notFound: false }), checkedAt: Date.now(), failed: true }))
      }
      // Keep refreshing around the game; before it, wake up when it's about to start.
      const now = Date.now()
      if (done) return
      if (inWindow(now)) timer = setTimeout(run, POLL_MS)
      else if (start !== undefined && now < start - WINDOW_BEFORE_MS)
        timer = setTimeout(run, Math.min(start - WINDOW_BEFORE_MS - now, 6 * 60 * 60 * 1000))
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

  const current = state?.key === key ? state : undefined
  return {
    summary: current?.summary,
    updatedAt: current?.updatedAt,
    checkedAt: current?.checkedAt,
    failed: current?.failed ?? false,
    notFound: current?.notFound ?? false,
  }
}
