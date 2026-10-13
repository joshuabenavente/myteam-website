import { expect, it } from 'vitest'
import { parseInjuries, type EspnInjuriesJson } from './injuries'

const injury = (name: string, team: string, status: string, details?: object) => ({
  status,
  athlete: { displayName: name, team: { abbreviation: team } },
  details,
})

it('groups absences by NBA team with readable reasons, most serious first', () => {
  const json: EspnInjuriesJson = {
    injuries: [
      {
        displayName: 'Golden State Warriors',
        injuries: [
          injury('A Player', 'GS', 'Day-To-Day', {
            type: 'Knee',
            detail: 'Tendinitis',
            returnDate: '2026-10-16',
            fantasyStatus: { abbreviation: 'GTD' },
          }),
          injury('B Player', 'GS', 'Out', { type: 'Ankle', detail: 'Sprain' }),
          injury('C Player', 'GS', 'Day-To-Day', { type: 'Rest', detail: 'Rest' }),
        ],
      },
      { displayName: 'Denver Nuggets', injuries: [injury('D Player', 'DEN', 'Out')] },
    ],
  }
  expect(parseInjuries(json)).toEqual({
    GSW: [
      { name: 'B Player', status: 'Out', gameTimeDecision: false, reason: 'Ankle (sprain)' },
      {
        name: 'A Player',
        status: 'Day-To-Day',
        gameTimeDecision: true,
        reason: 'Knee (tendinitis)',
        returnDate: '2026-10-16',
      },
      { name: 'C Player', status: 'Day-To-Day', gameTimeDecision: false, reason: 'Rest' },
    ],
    DEN: [{ name: 'D Player', status: 'Out', gameTimeDecision: false }],
  })
})
