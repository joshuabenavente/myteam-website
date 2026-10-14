import { expect, it } from 'vitest'
import scoreboard from './__fixtures__/espn-scoreboard.json'
import { espnDate, parseScoreboard, resultFor, scoreLine, spokenScore, staleMinutes } from './live'

// Captured Oct 13, 2026 during preseason: IND @ OKC in the 3rd, two finals, two not started.
const withStatus = (name: string, state: string, period: number, clock = '0.0') => {
  const copy = structuredClone(scoreboard)
  copy.events[2].competitions[0].status = { ...copy.events[2].competitions[0].status, period, displayClock: clock, type: { ...copy.events[2].competitions[0].status.type, name, state } }
  return copy
}

it('reads a game in progress', () => {
  const s = parseScoreboard(scoreboard, 'OKC')!
  expect(s).toMatchObject({ state: 'in', away: { abbr: 'IND', score: 84 }, home: { abbr: 'OKC', score: 82 }, detail: 'Q3 2:36' })
  expect(scoreLine(s)).toBe('IND 84–82 OKC')
  expect(spokenScore(s)).toBe('Indiana Pacers 84, Oklahoma City Thunder 82')
  // Either team finds the game.
  expect(parseScoreboard(scoreboard, 'IND')?.detail).toBe('Q3 2:36')
})

it('reads finals, games not started, and teams not playing', () => {
  expect(parseScoreboard(scoreboard, 'TOR')).toMatchObject({ state: 'final', detail: 'Final', home: { score: 148 } })
  expect(resultFor(parseScoreboard(scoreboard, 'TOR')!, 'TOR')).toBe('W 148–98')
  expect(resultFor(parseScoreboard(scoreboard, 'NYK')!, 'NYK')).toBe('L 98–148')
  // ESPN's "GS" is the NBA's "GSW".
  expect(parseScoreboard(scoreboard, 'GSW')).toMatchObject({ state: 'pre', away: { abbr: 'GSW' } })
  expect(parseScoreboard(scoreboard, 'DEN')).toBeUndefined()
  expect(parseScoreboard({}, 'DEN')).toBeUndefined()
  expect(parseScoreboard(null, 'DEN')).toBeUndefined()
})

it('names breaks, overtime and interruptions', () => {
  expect(parseScoreboard(withStatus('STATUS_HALFTIME', 'in', 2), 'OKC')?.detail).toBe('Halftime')
  expect(parseScoreboard(withStatus('STATUS_END_PERIOD', 'in', 3), 'OKC')?.detail).toBe('End of Q3')
  expect(parseScoreboard(withStatus('STATUS_IN_PROGRESS', 'in', 5, '1:12'), 'OKC')?.detail).toBe('OT 1:12')
  expect(parseScoreboard(withStatus('STATUS_IN_PROGRESS', 'in', 6, '4:00'), 'OKC')?.detail).toBe('2OT 4:00')
  expect(parseScoreboard(withStatus('STATUS_FINAL', 'post', 5), 'OKC')?.detail).toBe('Final/OT')
  expect(parseScoreboard(withStatus('STATUS_DELAYED', 'in', 2), 'OKC')?.state).toBe('delayed')
  expect(parseScoreboard(withStatus('STATUS_POSTPONED', 'post', 0), 'OKC')?.state).toBe('postponed')
})

it('changes the milestone only at breaks, not every basket', () => {
  const a = parseScoreboard(withStatus('STATUS_IN_PROGRESS', 'in', 3, '5:00'), 'OKC')!
  const b = parseScoreboard(withStatus('STATUS_IN_PROGRESS', 'in', 3, '2:10'), 'OKC')!
  const c = parseScoreboard(withStatus('STATUS_END_PERIOD', 'in', 3), 'OKC')!
  expect(a.milestone).toBe(b.milestone)
  expect(c.milestone).not.toBe(b.milestone)
})

it('asks ESPN for the Eastern date', () => {
  // 7:30 PM Mountain on Oct 22 is 9:30 PM Eastern, still Oct 22 there.
  expect(espnDate('2026-10-23T01:30:00Z')).toBe('20261022')
  // A late West Coast tip-off is after midnight UTC but still the same Eastern day.
  expect(espnDate('2026-10-23T03:00:00Z')).toBe('20261022')
})

it('calls a score stale after two minutes without an update', () => {
  expect(staleMinutes({ updatedAt: 0, checkedAt: 60_000 })).toBeUndefined()
  expect(staleMinutes({ updatedAt: 0, checkedAt: 180_000 })).toBe(3)
  expect(staleMinutes({})).toBeUndefined()
})
