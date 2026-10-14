import { expect, it } from 'vitest'
import live from './__fixtures__/espn-summary-live.json'
import pre from './__fixtures__/espn-summary-pre.json'
import { parseSummary, playsByPeriod } from './gameSummary'

// Captured Oct 13, 2026: IND @ OKC with 7:55 left in the 4th (preseason), and GS @ LAL before tip-off.
it('reads the score, line score and records', () => {
  const g = parseSummary(live)!
  expect(g).toMatchObject({ eventId: '401908621', state: 'in', detail: 'Q4 7:55' })
  expect(g.home).toMatchObject({ abbr: 'OKC', score: 92, record: '0-3', periods: ['25', '34', '26', '7'] })
  expect(g.away).toMatchObject({ abbr: 'IND', score: 87, periods: ['33', '28', '23', '3'] })
})

it('reads box scores with starters, totals and who did not play', () => {
  const { away } = parseSummary(live)!
  expect(away.players.length).toBeGreaterThan(5)
  expect(away.players.filter((p) => p.starter)).toHaveLength(5)
  const siakam = away.players.find((p) => p.name === 'Pascal Siakam')!
  expect(siakam.stats).toMatchObject({ MIN: '21', PTS: '6', FG: '2-11', '3PT': '0-4', '+/-': '+5' })
  expect(away.totals).toMatchObject({ PTS: '87', FG: '34-77', REB: '46' })
  for (const p of away.didNotPlay) expect(p.stats).toEqual({})
})

it('reads injuries and plays', () => {
  const g = parseSummary(live)!
  expect(g.away.injuries.find((i) => i.name === 'Johnny Furphy')).toMatchObject({ status: 'Out', detail: 'Knee Surgery' })
  expect(g.plays.length).toBeGreaterThan(400)
  const last = g.plays.at(-1)!
  expect(last).toMatchObject({ period: 4, team: 'IND', awayScore: 87, homeScore: 92, text: 'Keba Keita enters the game for Jay Huff' })
  expect(g.plays.filter((p) => p.scoring).at(-1)).toMatchObject({ team: 'OKC', homeScore: 92, scoring: true })
  const groups = playsByPeriod(g.plays)
  expect(groups.map(([p]) => p)).toEqual([4, 3, 2, 1])
  // Newest first within a period.
  expect(groups[0][1][0]).toBe(last)
})

it('reads a game that has not started', () => {
  const g = parseSummary(pre)!
  expect(g).toMatchObject({ state: 'pre', home: { abbr: 'LAL', players: [] }, away: { abbr: 'GSW' } })
  expect(g.plays).toEqual([])
  expect(parseSummary({})).toBeUndefined()
  expect(parseSummary(null)).toBeUndefined()
})
