import { expect, it } from 'vitest'
import { parseRoute, routeHref } from './route'

it('parses and builds routes', () => {
  expect(parseRoute('')).toEqual({ page: 'games' })
  expect(parseRoute('#/')).toEqual({ page: 'games' })
  expect(parseRoute('#/players')).toEqual({ page: 'players' })
  expect(parseRoute('#/players/jokicni01')).toEqual({ page: 'player', id: 'jokicni01' })
  expect(routeHref({ page: 'player', id: 'jokicni01' })).toBe('#/players/jokicni01')
})
