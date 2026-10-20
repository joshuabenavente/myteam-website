import { describe, expect, it } from 'vitest'
import { addDays, cardState, dayChannels, dayKeyFor, gamesOn, nextGameDay, orderForDay } from './day'
import type { LiveScore } from './scoreboard'
import type { DayGame } from './types'

const game = (id: string, startUtc: string, away: string, home: string, extra: Partial<DayGame> = {}): DayGame => ({
  id,
  type: 'regular',
  startUtc,
  home,
  away,
  status: 'scheduled',
  broadcasts: { national: [], home: [], away: [] },
  ...extra,
})

const live = (away: string, home: string, state: LiveScore['state'], a = 0, h = 0, detail = 'Q3 2:31'): LiveScore => ({
  state,
  away: { abbr: away, score: a },
  home: { abbr: home, score: h },
  detail,
  milestone: detail,
})

describe('days', () => {
  it('moves dates by calendar days, across months and DST', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
    expect(addDays('2027-03-14', 1)).toBe('2027-03-15')
  })

  it('reads yesterday, today and tomorrow in the viewer\'s time zone', () => {
    // 1:30 AM UTC on Oct 23 is still Oct 22 in Denver.
    const now = new Date('2026-10-23T01:30:00Z')
    expect(dayKeyFor('today', now, 'America/Denver')).toBe('2026-10-22')
    expect(dayKeyFor('tomorrow', now, 'America/Denver')).toBe('2026-10-23')
    expect(dayKeyFor('yesterday', now, 'Europe/London')).toBe('2026-10-22')
  })

  it('puts a late game on the evening it\'s played locally', () => {
    const late = game('1', '2026-10-23T04:30:00Z', 'DEN', 'LAL') // 9:30 PM Oct 22 in LA, 12:30 AM Oct 23 in New York
    expect(gamesOn([late], '2026-10-22', 'America/Los_Angeles')).toHaveLength(1)
    expect(gamesOn([late], '2026-10-22', 'America/New_York')).toHaveLength(0)
  })

  it('finds the next day with games', () => {
    const games = [game('1', '2026-10-21T23:00:00Z', 'MIN', 'MIA'), game('2', '2026-10-23T01:30:00Z', 'DEN', 'OKC')]
    expect(nextGameDay(games, '2026-10-21', 'America/New_York')).toBe('2026-10-22')
    expect(nextGameDay(games, '2026-10-23', 'America/New_York')).toBeUndefined()
  })
})

describe('cards', () => {
  const g = game('1', '2026-10-23T01:30:00Z', 'DEN', 'OKC')
  const before = Date.parse('2026-10-23T00:00:00Z')

  it('shows the schedule until ESPN has the game under way', () => {
    expect(cardState(g, undefined, before)).toEqual({ kind: 'scheduled' })
    expect(cardState(g, live('DEN', 'OKC', 'pre'), before)).toEqual({ kind: 'scheduled' })
    expect(cardState(g, live('DEN', 'OKC', 'in', 54, 60), before)).toEqual({ kind: 'live', detail: 'Q3 2:31', away: 54, home: 60 })
    expect(cardState(g, live('DEN', 'OKC', 'final', 112, 104, 'Final/OT'), before)).toMatchObject({ kind: 'final', detail: 'Final/OT' })
  })

  it('uses the schedule\'s final score, and says pending when the data is behind', () => {
    const done = { ...g, status: 'final' as const, score: { home: 104, away: 112 } }
    expect(cardState(done, undefined)).toEqual({ kind: 'final', detail: 'Final', away: 112, home: 104 })
    expect(cardState(g, undefined, Date.parse('2026-10-23T08:00:00Z'))).toEqual({ kind: 'pending' })
  })

  it('orders your team first, then live, upcoming by time, and finished last', () => {
    const cards = [
      { game: game('a', '2026-10-23T00:00:00Z', 'BOS', 'NYK'), state: { kind: 'final', detail: 'Final', away: 1, home: 2 } as const },
      { game: game('b', '2026-10-23T02:00:00Z', 'PHX', 'LAL'), state: { kind: 'scheduled' } as const },
      { game: game('c', '2026-10-23T01:00:00Z', 'MIA', 'CHI'), state: { kind: 'scheduled' } as const },
      { game: game('d', '2026-10-23T01:30:00Z', 'DEN', 'OKC'), state: { kind: 'scheduled' } as const },
      { game: game('e', '2026-10-23T00:30:00Z', 'GSW', 'SAC'), state: { kind: 'live', detail: 'Q1', away: 2, home: 0 } as const },
    ]
    expect(orderForDay(cards, 'DEN').map((c) => c.game.id)).toEqual(['d', 'e', 'c', 'b', 'a'])
    expect(orderForDay(cards).map((c) => c.game.id)).toEqual(['e', 'c', 'd', 'b', 'a'])
  })

  it('shows national TV, or each team\'s main local channel', () => {
    const tv = (name: string, scope: 'national' | 'local', kind: 'tv' | 'stream' = 'tv') => ({ name, scope, kind })
    expect(dayChannels({ ...g, broadcasts: { national: [tv('ESPN', 'national')], home: [tv('KSBI', 'local')], away: [] } }).map((c) => c.label)).toEqual(['ESPN'])
    expect(
      dayChannels({ ...g, broadcasts: { national: [], home: [tv('KSBI', 'local'), tv('Thunder+', 'local')], away: [tv('ALT/KTVD', 'local'), tv('Altitude+', 'local', 'stream')] } }).map((c) => c.label),
    ).toEqual(['Altitude', 'KSBI'])
  })
})
