import { useState } from 'react'
import { resultFor, scoreLine, spokenScore, staleMinutes, type LiveScore, type LiveStatus } from '../lib/live.ts'

interface Props {
  live: LiveStatus
  /** Show a bare "Live" pill when there's no score (ESPN unreachable) but the game has started. */
  started: boolean
}

/** The header's live chip: "● LIVE · DEN 84–82 OKC · Q3 2:36", then "Final · W 112–104". */
export function LivePill({ live, started }: Props) {
  const s = live.score
  if (s?.state === 'final') {
    return (
      <li className="hero-chip outline">
        {s.detail} · {resultFor(s, live.team) ?? scoreLine(s)}
      </li>
    )
  }
  if (s?.state === 'postponed') return <li className="hero-chip outline">Postponed</li>
  if (s?.state === 'delayed') return <li className="hero-chip live-pill delayed">Delayed</li>
  if (s?.state === 'in') {
    const stale = staleMinutes(live)
    return (
      <li className={`hero-chip live-pill ${stale ? 'stale' : ''}`}>
        <span className="live-dot" aria-hidden="true" />
        <span>
          Live · {scoreLine(s)} · {s.detail}
          {stale !== undefined && <span className="live-stale"> · updated {stale} min ago</span>}
        </span>
      </li>
    )
  }
  if (!started) return null
  return (
    <li className="hero-chip live-pill">
      <span className="live-dot" aria-hidden="true" />
      Live
    </li>
  )
}

/**
 * Tells screen readers about the start, each break and the final, with the score at that moment,
 * instead of announcing every basket.
 */
export function LiveAnnouncer({ score }: { score?: LiveScore }) {
  const [said, setSaid] = useState<{ milestone?: string; text: string }>({ text: '' })
  const milestone = score && score.state !== 'pre' ? score.milestone : undefined
  if (score && milestone && milestone !== said.milestone) {
    // Adjusting state during render: React re-renders right away with the new announcement.
    setSaid({ milestone, text: `${milestone}: ${spokenScore(score)}` })
  }
  return (
    <span className="sr-only" role="status">
      {said.text}
    </span>
  )
}

/** A schedule row's status while its game is being watched live: "● 84–82" over "Q3 2:36". */
export function LiveRowStatus({ score, team }: { score: LiveScore; team: string }) {
  if (score.state === 'final') {
    const r = resultFor(score, team)
    const won = r?.startsWith('W')
    return <span className={`result ${won ? 'win' : 'loss'}`}>{r?.replace('–', '-')}</span>
  }
  if (score.state !== 'in' && score.state !== 'delayed') return null
  const [us, them] = score.home.abbr === team ? [score.home, score.away] : [score.away, score.home]
  return (
    <span className="live-row">
      <span className="sr-only">
        {score.state === 'delayed' ? 'Delayed' : `Live, ${score.detail}`}: {spokenScore(score)}
      </span>
      <span className="live-pill small" aria-hidden="true">
        <span className="live-dot" aria-hidden="true" />
        {score.state === 'delayed' ? 'Delayed' : `${us.score}–${them.score}`}
      </span>
      {score.state === 'in' && (
        <span className="muted small" aria-hidden="true">
          {score.detail}
        </span>
      )}
    </span>
  )
}
