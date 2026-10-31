/** The glass app preview: /<team>?glass=1. Links inside the site keep the query, so it stays on. */
export const glassOn = () => new URLSearchParams(window.location.search).get('glass') === '1'
