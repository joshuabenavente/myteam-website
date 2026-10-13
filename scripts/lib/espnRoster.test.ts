import { expect, it } from 'vitest'
import { nameKey, parseEspnRoster } from './espnRoster'

it('matches names across sources', () => {
  expect(nameKey('Nikola Jokić')).toBe(nameKey('Nikola Jokic'))
  expect(nameKey('DaRon Holmes II')).toBe(nameKey('DaRon Holmes'))
  expect(nameKey('Lonnie Walker IV')).toBe('lonnie walker')
  expect(nameKey("De'Aaron Fox Jr.")).toBe('deaaron fox')
})

it('reads number, photo and bio', () => {
  const roster = parseEspnRoster({
    athletes: [
      {
        fullName: 'Nikola Jokic',
        jersey: '15',
        displayHeight: `6' 11"`,
        weight: 284,
        dateOfBirth: '1995-02-19T08:00Z',
        headshot: { href: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png' },
        experience: { years: 12 },
        birthPlace: { city: 'Sombor', country: 'Serbia' },
      },
    ],
  })
  expect(roster.get(nameKey('Nikola Jokić'))).toEqual({
    number: '15',
    headshot: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png',
    bio: { height: `6' 11"`, weight: 284, birthDate: '1995-02-19', experience: 12, birthPlace: 'Sombor, Serbia' },
  })
})
