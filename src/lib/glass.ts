import type { Route } from './route.ts'

/** The glass app preview: /<team>?glass=1. Links inside the site keep the query, so it stays on. */
export const glassOn = () => new URLSearchParams(window.location.search).get('glass') === '1'

/** In the glass app, player and game pages get a back chevron where the logo would be. */
export const hasBack = (route: Route) => route.page === 'player' || route.page === 'game'
