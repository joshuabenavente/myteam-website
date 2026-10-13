import { expect, it } from 'vitest'
import { RADAR_AXES, scale } from './radar'

it('places values within each axis range and clamps', () => {
  const pts = RADAR_AXES.find((a) => a.key === 'pts')!
  const fg = RADAR_AXES.find((a) => a.key === 'fg')!
  expect(scale(pts, 17.5)).toBe(0.5)
  expect(scale(pts, 40)).toBe(1)
  expect(scale(fg, 0.5)).toBeCloseTo(0.5)
  expect(scale(fg, 0.2)).toBe(0)
  expect(scale(fg, undefined)).toBe(0)
})
