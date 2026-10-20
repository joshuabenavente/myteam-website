import { describe, expect, it } from 'vitest'
import { idsByName, nameKey } from './names'

describe('idsByName', () => {
  it('matches across accents, punctuation and suffixes', () => {
    const ids = idsByName([{ id: 'jokicni01', name: 'Nikola Jokić' }, { id: 'portemi01', name: 'Michael Porter Jr.' }])
    expect(ids.get(nameKey('Nikola Jokic'))).toBe('jokicni01')
    expect(ids.get(nameKey('Michael Porter'))).toBe('portemi01')
  })

  it('leaves out a name two players share, rather than guess', () => {
    const ids = idsByName([{ id: 'a', name: 'Jaylin Williams' }, { id: 'b', name: 'Jaylin Williams' }, { id: 'c', name: 'Other Player' }])
    expect(ids.has(nameKey('Jaylin Williams'))).toBe(false)
    expect(ids.get(nameKey('Other Player'))).toBe('c')
  })
})
