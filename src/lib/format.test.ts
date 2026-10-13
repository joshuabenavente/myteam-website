import { describe, expect, it } from 'vitest'
import {
  finishedSeriesSummary,
  formatGameDate,
  formatGameTime,
  groupByMonth,
  ordinal,
  seriesSummary,
  timeZoneAbbr,
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
