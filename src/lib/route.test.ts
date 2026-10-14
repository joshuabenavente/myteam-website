import { expect, it } from 'vitest'
import { parseRoute, routeHref } from './route'

it('parses and builds routes', () => {
  expect(parseRoute('')).toEqual({ page: 'games' })
  expect(parseRoute('#/')).toEqual({ page: 'games' })
  expect(parseRoute('#/players')).toEqual({ page: 'players' })
  expect(parseRoute('#/players/jokicni01')).toEqual({ page: 'player', id: 'jokicni01' })
  expect(routeHref({ page: 'player', id: 'jokicni01' })).toBe('#/players/jokicni01')
  expect(parseRoute('#/games/0022600007')).toEqual({ page: 'game', id: '0022600007' })
  expect(parseRoute('#/games')).toEqual({ page: 'games' })
  expect(routeHref({ page: 'game', id: '0022600007' })).toBe('#/games/0022600007')
})
