import { expect, it } from 'vitest'
import { legacyPath, parseRoute, routeHref } from './route'

it('parses team paths', () => {
  expect(parseRoute('/')).toEqual({ page: 'home' })
  expect(parseRoute('/teams')).toEqual({ page: 'picker' })
  expect(parseRoute('/denver-nuggets')).toEqual({ page: 'games', team: 'denver-nuggets' })
  expect(parseRoute('/denver-nuggets/')).toEqual({ page: 'games', team: 'denver-nuggets' })
  expect(parseRoute('/denver-nuggets/players')).toEqual({ page: 'players', team: 'denver-nuggets' })
  expect(parseRoute('/denver-nuggets/players/jokicni01')).toEqual({ page: 'player', team: 'denver-nuggets', id: 'jokicni01' })
  expect(parseRoute('/denver-nuggets/games/0022600007')).toEqual({ page: 'game', team: 'denver-nuggets', id: '0022600007' })
  expect(parseRoute('/denver-nuggets/games')).toEqual({ page: 'games', team: 'denver-nuggets' })
})

it('builds team paths', () => {
  expect(routeHref({ page: 'games' }, 'la-clippers')).toBe('/la-clippers')
  expect(routeHref({ page: 'players' }, 'la-clippers')).toBe('/la-clippers/players')
  expect(routeHref({ page: 'player', id: 'x' }, 'la-clippers')).toBe('/la-clippers/players/x')
  expect(routeHref({ page: 'game', id: '1' }, 'la-clippers')).toBe('/la-clippers/games/1')
  expect(routeHref({ page: 'picker' })).toBe('/teams')
})

it('forwards old #/ links to Denver', () => {
  expect(legacyPath('#/')).toBe('/denver-nuggets')
  expect(legacyPath('#/players')).toBe('/denver-nuggets/players')
  expect(legacyPath('#/players/jokicni01')).toBe('/denver-nuggets/players/jokicni01')
  expect(legacyPath('#/games/0022600007')).toBe('/denver-nuggets/games/0022600007')
  expect(legacyPath('')).toBeUndefined()
  expect(legacyPath('#main')).toBeUndefined()
})

it('has a page for today', () => {
  expect(parseRoute('/today')).toEqual({ page: 'today' })
  expect(parseRoute('/today/')).toEqual({ page: 'today' })
  expect(routeHref({ page: 'today' })).toBe('/today')
})
