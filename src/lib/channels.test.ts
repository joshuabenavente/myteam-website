import { expect, it } from 'vitest'
import { channelsFor } from './channels'

it('splits combined local channels into readable names', () => {
  expect(
    channelsFor([
      { name: 'Peacock', scope: 'national', kind: 'tv' },
      { name: 'ALT2/ALT+/KTVD/KUSA', scope: 'local', kind: 'tv' },
      { name: 'Altitude/Altitude+', scope: 'local', kind: 'tv' },
    ]).map((c) => `${c.label}:${c.scope}:${c.kind}`),
  ).toEqual([
    'Peacock:national:stream',
    'Altitude 2:local:tv',
    'Altitude+:local:stream',
    'KTVD 20:local:tv',
    '9News:local:tv',
    'Altitude:local:tv',
  ])
})

it('leaves unknown names alone', () => {
  expect(channelsFor([{ name: 'ESPN', scope: 'national', kind: 'tv' }])).toEqual([
    { label: 'ESPN', scope: 'national', kind: 'tv' },
  ])
})
