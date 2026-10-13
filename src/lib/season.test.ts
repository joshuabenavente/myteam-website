import { describe, expect, it } from 'vitest'
import { gameTypeFromNbaId, previousSeason, seasonForDate } from './season'

describe('seasonForDate', () => {
  it('rolls over on August 1', () => {
    expect(seasonForDate(new Date('2026-07-31T12:00:00Z')).label).toBe('2025-26')
    expect(seasonForDate(new Date('2026-08-01T12:00:00Z')).label).toBe('2026-27')
  })

  it('uses the end year for basketball-reference/ESPN', () => {
    const s = seasonForDate(new Date('2026-10-13T00:00:00Z'))
    expect(s).toEqual({ startYear: 2026, endYear: 2027, label: '2026-27' })
    expect(previousSeason(s).endYear).toBe(2026)
  })
})

describe('gameTypeFromNbaId', () => {
  it.each([
    ['0012600001', 'excluded'],
    ['0022600001', 'regular'],
    ['0032600001', 'excluded'],
    ['0042600101', 'playoffs'],
    ['0052600001', 'excluded'],
    ['0062600001', 'excluded'],
  ])('%s -> %s', (id, type) => {
    expect(gameTypeFromNbaId(id)).toBe(type)
  })
})
