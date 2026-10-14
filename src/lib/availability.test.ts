import { expect, it } from 'vitest'
import { absencesForGame, availabilityLabel, isGameTimeDecision, nextGames } from './availability'

it('drops players expected back before the game', () => {
  const list = [
    { name: 'Back already', status: 'Day-To-Day', gameTimeDecision: true, returnDate: '2026-10-21' },
    { name: 'Back that day', status: 'Day-To-Day', gameTimeDecision: true, returnDate: '2026-10-22' },
    { name: 'No date', status: 'Out', gameTimeDecision: false },
  ]
  // 01:30 UTC Oct 23 is the evening of Oct 22 in Denver.
  expect(absencesForGame(list, { startUtc: '2026-10-23T01:30:00Z' }).map((a) => a.name)).toEqual([
    'Back that day',
    'No date',
  ])
  expect(absencesForGame(undefined, { startUtc: '2026-10-23T01:30:00Z' })).toEqual([])
})

it('picks the next unstarted games', () => {
  const games = ['final', 'live', 'scheduled', 'scheduled', 'scheduled', 'scheduled'].map((status, i) => ({
    id: String(i),
    status: status as 'final' | 'live' | 'scheduled',
    startUtc: `2026-10-2${i}T00:00:00Z`,
  }))
  expect(nextGames(games).map((g) => g.id)).toEqual(['2', '3', '4'])
})

it('labels availability with one status', () => {
  expect(availabilityLabel({ status: 'Day-To-Day' })).toBe('Day-to-day')
  expect(availabilityLabel({ status: 'Out' })).toBe('Out')
  expect(isGameTimeDecision({ status: 'Day-To-Day', gameTimeDecision: true })).toBe(true)
  expect(isGameTimeDecision({ status: 'Out', gameTimeDecision: true })).toBe(false)
  expect(isGameTimeDecision({ status: 'Day-To-Day', gameTimeDecision: false })).toBe(false)
})
