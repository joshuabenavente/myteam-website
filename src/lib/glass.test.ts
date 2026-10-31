import { afterEach, expect, it, vi } from 'vitest'
import { glassOn } from './glass'

function visit(search: string, storage: Map<string, string> | 'blocked') {
  const localStorage =
    storage === 'blocked'
      ? { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
      : {
          getItem: (k: string) => storage.get(k) ?? null,
          setItem: (k: string, v: string) => void storage.set(k, v),
          removeItem: (k: string) => void storage.delete(k),
        }
  vi.stubGlobal('window', { location: { search }, localStorage })
}

afterEach(() => vi.unstubAllGlobals())

it('stays on after ?glass=1 until ?glass=0', () => {
  const storage = new Map<string, string>()
  visit('', storage)
  expect(glassOn()).toBe(false)
  visit('?glass=1', storage)
  expect(glassOn()).toBe(true)
  // The installed app opens without the query.
  visit('', storage)
  expect(glassOn()).toBe(true)
  visit('?glass=0', storage)
  expect(glassOn()).toBe(false)
  visit('', storage)
  expect(glassOn()).toBe(false)
})

it('follows the address when storage is blocked', () => {
  visit('?glass=1', 'blocked')
  expect(glassOn()).toBe(true)
  visit('', 'blocked')
  expect(glassOn()).toBe(false)
})
