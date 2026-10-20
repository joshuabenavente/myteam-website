import { expect, it } from 'vitest'
import { countdownLabel, headlineChannel, headlineGame, lastResult, listedFor, shortName } from './hero'

it('headlines a live game, otherwise the next scheduled one', () => {
  const statuses = (s: string[]) => s.map((status, i) => ({ id: String(i), status }))
  expect(headlineGame(statuses(['final', 'scheduled', 'scheduled']))?.id).toBe('1')
  expect(headlineGame(statuses(['final', 'live', 'scheduled']))?.id).toBe('1')
  expect(headlineGame(statuses(['final', 'final']))).toBeUndefined()
})

it('counts calendar days in the viewer time zone', () => {
  const game = { startUtc: '2026-10-23T01:30:00Z' } // 7:30 PM Oct 22 in Denver
  const tz = 'America/Denver'
  expect(countdownLabel(game, new Date('2026-10-13T18:00:00Z'), tz)).toBe('In 9 days')
  expect(countdownLabel(game, new Date('2026-10-22T05:00:00Z'), tz)).toBe('Tomorrow')
  expect(countdownLabel(game, new Date('2026-10-22T15:00:00Z'), tz)).toBe('Tonight')
  // Late at night on Oct 22 in Denver it's already Oct 23 in UTC; still "Tonight" there.
  expect(countdownLabel(game, new Date('2026-10-23T01:00:00Z'), tz)).toBe('Tonight')
  // In Tokyo the same game is on Oct 23 at 10:30 AM.
  expect(countdownLabel(game, new Date('2026-10-22T10:00:00Z'), 'Asia/Tokyo')).toBe('Tomorrow')
  expect(countdownLabel({ startUtc: '2026-10-22T19:00:00Z' }, new Date('2026-10-22T15:00:00Z'), tz)).toBe('Today')
  expect(countdownLabel({ ...game, timeTbd: true }, new Date('2026-10-22T15:00:00Z'), tz)).toBe('Today')
})

it('shortens names to an initial and last name', () => {
  expect(shortName('Spencer Jones')).toBe('S. Jones')
  expect(shortName('Jimmy Butler III')).toBe('J. Butler III')
  expect(shortName("Nae'Qwan Tomlin")).toBe('N. Tomlin')
  expect(shortName('CJ McCollum')).toBe('CJ McCollum')
  expect(shortName('P.J. Washington')).toBe('P.J. Washington')
  expect(shortName('Nene')).toBe('Nene')
})

it('lists Out before day-to-day and drops players back by game day', () => {
  const list = [
    { name: 'A', status: 'Day-To-Day', gameTimeDecision: true },
    { name: 'B', status: 'Out', gameTimeDecision: false },
    { name: 'C', status: 'Day-To-Day', gameTimeDecision: true, returnDate: '2026-10-01' },
    { name: 'D', status: 'Out', gameTimeDecision: false },
  ]
  expect(listedFor(list, { startUtc: '2026-10-23T01:30:00Z' }).map((a) => a.name)).toEqual(['B', 'D', 'A'])
})

it('prefers a national channel', () => {
  const local = { name: 'ALT/KTVD', scope: 'local' as const, kind: 'tv' as const }
  const espn = { name: 'ESPN', scope: 'national' as const, kind: 'tv' as const }
  expect(headlineChannel({ broadcasts: [local, espn] })?.label).toBe('ESPN')
  expect(headlineChannel({ broadcasts: [local] })?.label).toBe('Altitude')
  expect(headlineChannel({ broadcasts: [] })).toBeUndefined()
})

it('skips a game still marked scheduled hours after it must have ended', () => {
  const games = [
    { id: 'a', status: 'scheduled', startUtc: '2026-10-23T01:30:00Z' },
    { id: 'b', status: 'scheduled', startUtc: '2026-10-25T01:00:00Z' },
  ]
  // During and just after game a, it's still the headline (the live score covers it).
  expect(headlineGame(games, Date.parse('2026-10-23T04:00:00Z'))?.id).toBe('a')
  // The next morning the data hasn't caught up; game b is next.
  expect(headlineGame(games, Date.parse('2026-10-23T15:00:00Z'))?.id).toBe('b')
})

it('finds the last finished game', () => {
  const g = (id: string, startUtc: string, status: 'final' | 'scheduled', score?: { team: number; opponent: number }) => ({ id, startUtc, status, score })
  expect(lastResult([g('1', '2026-10-23T01:30:00Z', 'scheduled')])).toBeUndefined()
  expect(
    lastResult([
      g('2', '2026-10-25T01:00:00Z', 'final', { team: 114, opponent: 108 }),
      g('1', '2026-10-23T01:30:00Z', 'final', { team: 99, opponent: 101 }),
      g('3', '2026-10-27T01:00:00Z', 'scheduled'),
    ])?.id,
  ).toBe('2')
})
