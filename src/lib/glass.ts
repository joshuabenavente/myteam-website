import type { Route } from './route.ts'

const SAVED = 'myteam:glass'

/**
 * The glass app preview. /<team>?glass=1 turns it on and ?glass=0 off, and the choice stays on
 * this device (so the installed app, which opens without the query, follows it too). Links
 * inside the site keep the query as well.
 */
export function glassOn(): boolean {
  const asked = new URLSearchParams(window.location.search).get('glass')
  try {
    if (asked === '1') window.localStorage.setItem(SAVED, '1')
    else if (asked === '0') window.localStorage.removeItem(SAVED)
    else return window.localStorage.getItem(SAVED) === '1'
  } catch {
    // Private browsing or blocked storage: only the address counts.
  }
  return asked === '1'
}

/** In the glass app, player and game pages get a back chevron where the logo would be. */
export const hasBack = (route: Route) => route.page === 'player' || route.page === 'game'
