import { describe, expect, it } from 'vitest'
import { gameForLogEntry } from './gameLog'
import type { Game, GameLogEntry } from './types'

const game = (over: Partial<Game> = {}): Game => ({
  id: '0022600010',
  type: 'regular',
  // 9 PM Eastern on Oct 22 is Oct 23 in UTC.
  startUtc: '2026-10-23T01:00:00Z',
  home: true,
  opponent: 'LAL',
  status: 'final',
  score: { team: 121, opponent: 112 },
  broadcasts: [],
  ...over,
})

const entry = (over: Partial<GameLogEntry> = {}): GameLogEntry =>
  ({ date: '2026-10-22', opponent: 'LAL', home: true, result: 'W', score: '121-112', ...over }) as GameLogEntry

describe('gameForLogEntry', () => {
  it('matches the final with the same opponent, venue, day and score', () => {
    expect(gameForLogEntry(entry(), [game({ id: 'a', opponent: 'PHX' }), game()])?.id).toBe('0022600010')
  })

  it('reads the score with overtime', () => {
    expect(gameForLogEntry(entry({ score: '121-112 (OT)' }), [game()])?.id).toBe('0022600010')
  })

  it('needs the score, venue and status to agree', () => {
    expect(gameForLogEntry(entry({ score: '112-121' }), [game()])).toBeUndefined()
    expect(gameForLogEntry(entry({ home: false }), [game()])).toBeUndefined()
    expect(gameForLogEntry(entry(), [game({ status: 'live' })])).toBeUndefined()
  })

  it('does not link a game from a former team (not in this schedule)', () => {
    expect(gameForLogEntry(entry({ opponent: 'BOS', score: '99-104' }), [game()])).toBeUndefined()
  })

  it('does not match a game days away', () => {
    expect(gameForLogEntry(entry({ date: '2026-10-25' }), [game()])).toBeUndefined()
  })

  it('gives no link when more than one game matches', () => {
    expect(gameForLogEntry(entry(), [game(), game({ id: 'b', startUtc: '2026-10-22T02:00:00Z' })])).toBeUndefined()
  })
})
