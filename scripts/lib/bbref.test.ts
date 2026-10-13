import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { gameLogUrl, parseGameLog, parseRoster, sumGameLog } from './bbref'

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')

describe('parseRoster', () => {
  it('reads player IDs, names, positions and two-way status', () => {
    expect(parseRoster(fixture('bbref-roster.html'))).toEqual([
      {
        id: 'baglema01',
        name: 'Marvin Bagley III',
        position: 'F-C',
        twoWay: false,
        bio: { height: `6' 10"`, weight: 235, birthDate: '1999-03-14', experience: 8, college: 'Duke' },
      },
      {
        id: 'nembhry01',
        name: 'Ryan Nembhard',
        position: 'G',
        twoWay: true,
        bio: { height: `5' 11"`, weight: 180, birthDate: '2003-03-10', experience: 1, college: 'Creighton, Gonzaga' },
      },
    ])
  })
})

describe('parseGameLog', () => {
  const log = parseGameLog(fixture('bbref-gamelog.html'))

  it('keeps played games and skips inactive and header rows', () => {
    expect(log.regular.map((r) => r.teamGame)).toEqual([1, 2, 3])
  })

  it('reads tables wrapped in HTML comments', () => {
    expect(log.playoffs.map((r) => r.points)).toEqual([25, 24])
  })

  it('converts minutes and reads counting stats', () => {
    expect(log.regular[0]).toMatchObject({
      started: true,
      points: 21,
      rebounds: 13,
      assists: 10,
      fgMade: 8,
      fgAttempted: 23,
      threeMade: 2,
      threeAttempted: 13,
    })
    expect(log.regular[0].minutes).toBe(40.8)
  })

  it('reads date, opponent, location and result', () => {
    expect(log.regular[0]).toMatchObject({
      date: '2025-10-23',
      opponent: 'GSW',
      home: false,
      result: 'L',
      score: '131-137 (OT)',
    })
    // basketball-reference's PHO becomes the NBA's PHX.
    expect(log.regular[1]).toMatchObject({ opponent: 'PHX', home: true, result: 'W', score: '133-111' })
  })
})

describe('sumGameLog', () => {
  const rows = parseGameLog(fixture('bbref-gamelog.html')).regular

  it('totals every game by default', () => {
    expect(sumGameLog(rows)).toMatchObject({ games: 3, started: 3, points: 60, rebounds: 46, assists: 35 })
  })

  it('stops at a team game number', () => {
    expect(sumGameLog(rows, 2)).toMatchObject({ games: 2, points: 35 })
  })

  it('returns undefined when no games qualify', () => {
    expect(sumGameLog(rows, 0)).toBeUndefined()
    expect(sumGameLog([])).toBeUndefined()
  })
})

it('builds game log URLs', () => {
  expect(gameLogUrl('jokicni01', 2026)).toBe('https://www.basketball-reference.com/players/j/jokicni01/gamelog/2026')
})
