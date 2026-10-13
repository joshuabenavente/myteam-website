import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { gameLogUrl, parseGameLog, parseRoster, sumGameLog } from './bbref'

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')

describe('parseRoster', () => {
  it('reads player IDs, names, positions and two-way status', () => {
    expect(parseRoster(fixture('bbref-roster.html'))).toEqual([
      { id: 'baglema01', name: 'Marvin Bagley III', position: 'F-C', twoWay: false },
      { id: 'nembhry01', name: 'Ryan Nembhard', position: 'G', twoWay: true },
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
    expect(log.regular[0].minutes).toBeCloseTo(40 + 50 / 60)
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
