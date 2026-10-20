// The browser side of seo.ts: keeping the head in step, and the page's plain-HTML snapshot, read
// before the app replaces it. If the app's data can't load, the page shows the snapshot instead
// of only an error.

import { SITE, type Head } from './seo.ts'

const root = typeof document === 'undefined' ? null : document.getElementById('root')
const html = root?.querySelector(':scope > .snapshot')?.outerHTML
const path = typeof window === 'undefined' ? '' : window.location.pathname.replace(/(.)\/+$/, '$1')

/** The snapshot for `pathname`, if the page was loaded at that address. */
export const snapshotFor = (pathname: string) => (html && pathname === path ? html : undefined)

/** Keep the title, description and canonical address in step with in-app navigation. */
export function applyHead(head: Head) {
  document.title = head.title
  document.querySelector('meta[name="description"]')?.setAttribute('content', head.description)
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = SITE + head.path
}
