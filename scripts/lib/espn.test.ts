import { expect, it } from 'vitest'
import { findEspnEventId, parseEspnResults, type EspnScheduleJson } from './espn'

const event = (home: string, away: string, homeScore: number, awayScore: number, completed = true) => ({
  date: '2026-04-18T19:30Z',
  competitions: [
    {
      status: { type: { completed } },
      competitors: [
        { homeAway: 'home' as const, team: { abbreviation: home }, score: { value: homeScore } },
        { homeAway: 'away' as const, team: { abbreviation: away }, score: { value: awayScore } },
      ],
    },
  ],
})

it('maps ESPN abbreviations and skips unfinished games', () => {
  const json: EspnScheduleJson = { events: [event('DEN', 'GS', 120, 110), event('UTAH', 'DEN', 0, 0, false)] }
  expect(parseEspnResults(json, 'playoffs')).toEqual([
    { type: 'playoffs', startUtc: '2026-04-18T19:30:00.000Z', home: 'DEN', away: 'GSW', homeScore: 120, awayScore: 110 },
  ])
})

it('matches ESPN events', () => {
  const schedule = {
    events: [
      { id: '1', date: '2026-10-23T01:30Z', competitions: [{ competitors: [event('OKC', 'DEN', 0, 0).competitions[0].competitors].flat() }] },
    ],
  }
  expect(findEspnEventId(schedule, 'OKC', '2026-10-23T01:30:00Z')).toBe('1')
  expect(findEspnEventId(schedule, 'OKC', '2026-11-23T01:30:00Z')).toBeUndefined()
  expect(findEspnEventId(schedule, 'LAL', '2026-10-23T01:30:00Z')).toBeUndefined()
})
