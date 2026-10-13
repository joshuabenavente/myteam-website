import { describe, expect, it } from 'vitest'
import {
  finishedSeriesSummary,
  formatGameDate,
  formatGameTime,
  groupByMonth,
  ordinal,
  seriesSummary,
  timeZoneAbbr,
  dayKey,
  addMonths,
  compareMonths,
  monthOf,
  monthLabel,
  monthGrid,
} from './format'

it('ordinal', () => {
  expect([1, 2, 3, 4, 11, 12, 13, 15, 21, 22].map(ordinal)).toEqual([
    '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '15th', '21st', '22nd',
  ])
})

describe('series summaries', () => {
  it('describes the current series', () => {
    expect(seriesSummary({ wins: 0, losses: 0 })).toBe('No games yet')
    expect(seriesSummary({ wins: 2, losses: 1 })).toBe('Leads 2-1')
    expect(seriesSummary({ wins: 0, losses: 1 })).toBe('Trails 0-1')
    expect(seriesSummary({ wins: 1, losses: 1 })).toBe('Tied 1-1')
  })

  it('describes a finished series', () => {
    expect(finishedSeriesSummary({ wins: 3, losses: 1 })).toBe('Won 3-1')
    expect(finishedSeriesSummary({ wins: 2, losses: 4 })).toBe('Lost 2-4')
    expect(finishedSeriesSummary({ wins: 2, losses: 2 })).toBe('Split 2-2')
    expect(finishedSeriesSummary({ wins: 0, losses: 0 })).toBe('Did not play')
  })
})

describe('time zones', () => {
  // 01:30 UTC on Oct 23 is the evening of Oct 22 in Denver and Oct 23 in London.
  const game = { startUtc: '2026-10-23T01:30:00Z' }

  it('formats dates and times in the given zone', () => {
    expect(formatGameDate(game.startUtc, 'America/Denver')).toEqual({ weekday: 'Thu', monthDay: 'Oct 22' })
    expect(formatGameTime(game, 'America/Denver')).toBe('7:30 PM')
    expect(formatGameDate(game.startUtc, 'Europe/London')).toEqual({ weekday: 'Fri', monthDay: 'Oct 23' })
    expect(formatGameTime(game, 'America/New_York')).toBe('9:30 PM')
  })

  it('shows TBD for unannounced times', () => {
    expect(formatGameTime({ ...game, timeTbd: true }, 'America/Denver')).toBe('TBD')
  })

  it('abbreviates the zone', () => {
    expect(timeZoneAbbr('America/Denver', new Date(game.startUtc))).toBe('MDT')
  })

  it('groups by month in the viewer zone', () => {
    const games = [{ startUtc: '2026-11-01T01:00:00Z' }, { startUtc: '2026-11-02T01:00:00Z' }]
    expect(groupByMonth(games, 'America/Denver').map(([m, g]) => [m, g.length])).toEqual([
      ['October 2026', 1],
      ['November 2026', 1],
    ])
  })
})

describe('calendar helpers', () => {
  it('keys days in the viewer zone', () => {
    expect(dayKey('2026-10-23T01:30:00Z', 'America/Denver')).toBe('2026-10-22')
    expect(dayKey('2026-10-23T01:30:00Z', 'Europe/London')).toBe('2026-10-23')
  })

  it('does month arithmetic across years', () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(addMonths({ year: 2027, month: 0 }, -1)).toEqual({ year: 2026, month: 11 })
    expect(compareMonths({ year: 2027, month: 0 }, { year: 2026, month: 11 })).toBeGreaterThan(0)
    expect(monthOf('2026-10-22')).toEqual({ year: 2026, month: 9 })
    expect(monthLabel({ year: 2026, month: 9 })).toBe('October 2026')
  })

  it('builds a Sunday-first grid', () => {
    // October 2026 starts on a Thursday and has 31 days.
    const weeks = monthGrid({ year: 2026, month: 9 })
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03'])
    expect(weeks[4]).toEqual(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'])
    // February 2026 starts on a Sunday: exactly four weeks.
    expect(monthGrid({ year: 2026, month: 1 })).toHaveLength(4)
  })
})
