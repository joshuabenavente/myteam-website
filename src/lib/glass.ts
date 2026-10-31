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

/** Opened from the home screen or app list, rather than in a browser tab. */
export const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/**
 * Turn the preview on or off from inside the page (the installed app's footer switch: an
 * installed iPhone app has its own storage and no address bar). Reloads, since the look is set
 * up when the page starts.
 */
export function setGlass(on: boolean) {
  const params = new URLSearchParams(window.location.search)
  params.set('glass', on ? '1' : '0')
  window.location.replace(`${window.location.pathname}?${params}`)
}

/** In the glass app, player and game pages get a back chevron where the logo would be. */
export const hasBack = (route: Route) => route.page === 'player' || route.page === 'game'
