import { describe, expect, it } from 'vitest'
import { canAddToCalendar, gameIcs, gameIcsName } from './calendar'
import type { Game } from './types'

const game = (over: Partial<Game> = {}): Game => ({
  id: '0022600007', type: 'regular', startUtc: '2026-10-23T01:30:00Z', home: false, opponent: 'OKC', status: 'scheduled',
  broadcasts: [{ name: 'ESPN', scope: 'national', kind: 'tv' }], ...over,
})
const NOW = Date.parse('2026-10-20T12:00:00Z')
const unfold = (ics: string) => ics.replace(/\r\n /g, '')
const field = (ics: string, name: string) => unfold(ics).split('\r\n').find((l) => l.startsWith(name + ':'))

describe('gameIcs', () => {
  it('writes one event with the tip-off in UTC, a 2.5 hour length and a stable id', () => {
    const ics = gameIcs(game(), 'DEN', NOW)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(field(ics, 'UID')).toBe('UID:0022600007@myteam.fans')
    expect(field(ics, 'DTSTAMP')).toBe('DTSTAMP:20261020T120000Z')
    expect(field(ics, 'DTSTART')).toBe('DTSTART:20261023T013000Z')
    expect(field(ics, 'DTEND')).toBe('DTEND:20261023T040000Z')
  })

  it('names the matchup away-first, from either side', () => {
    expect(field(gameIcs(game({ home: false }), 'DEN', NOW), 'SUMMARY')).toBe('SUMMARY:Nuggets at Thunder')
    expect(field(gameIcs(game({ home: true }), 'DEN', NOW), 'SUMMARY')).toBe('SUMMARY:Thunder at Nuggets')
  })

  it("links the game's canonical page (the home team's) and lists the channels", () => {
    const ics = gameIcs(game({ home: false }), 'DEN', NOW)
    expect(field(ics, 'URL')).toBe('URL:https://myteam.fans/oklahoma-city-thunder/games/0022600007')
    expect(field(ics, 'DESCRIPTION')).toContain('On: ESPN')
    expect(field(ics, 'DESCRIPTION')).toContain('https://myteam.fans/oklahoma-city-thunder/games/0022600007')
  })

  it('escapes text, adds the neutral site, and folds long lines at 75 bytes', () => {
    const ics = gameIcs(game({ neutralSite: 'Mexico City, Mexico', label: 'NBA Mexico City Game; Neutral Site' }), 'DEN', NOW)
    expect(field(ics, 'LOCATION')).toBe('LOCATION:Mexico City\\, Mexico')
    expect(field(ics, 'DESCRIPTION')).toContain('NBA Mexico City Game\\; Neutral Site\\nOn: ESPN')
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
})

it('doubles a backslash in text', () => {
  const ics = gameIcs(game({ label: 'A\\B' }), 'DEN', NOW)
  expect(field(ics, 'DESCRIPTION')).toContain('A\\\\B')
})

describe('canAddToCalendar', () => {
  it('only for a game that has a tip-off time and has not started', () => {
    expect(canAddToCalendar(game())).toBe(true)
    expect(canAddToCalendar(game({ timeTbd: true }))).toBe(false)
    expect(canAddToCalendar(game({ status: 'live' }))).toBe(false)
    expect(canAddToCalendar(game({ status: 'final' }))).toBe(false)
  })
})

describe('gameIcsName', () => {
  it('is readable and dated', () => {
    expect(gameIcsName(game(), 'DEN')).toBe('nuggets-at-thunder-2026-10-23.ics')
  })
})
