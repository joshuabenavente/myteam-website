// myteam.fans service worker: opens fast and works offline once installed.
//
// The build (vite.config.ts) fills in VERSION and PRECACHE, so every deploy installs a fresh copy
// of the app files and drops the old one.
//
// - Pages: from the network, so a new deploy shows straight away; offline, the copy saved
//   last time, or the app shell (404.html loads the app for any address).
// - App files (scripts, styles, fonts): saved at install. Their names change with every build.
// - Data (/data/*.json): from the network for fresh scores and injuries; offline, the last copy,
//   marked with an X-Myteam-Offline header so the page can say how old it is.
// - Anything from other sites (ESPN live scores, logos) isn't touched, so a score is never stale.

const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const APP_CACHE = `app-${VERSION}`
const PAGE_CACHE = 'pages'
const DATA_CACHE = 'data'
// Servers can send Vary headers (Origin, Accept-Encoding) that would stop saved copies matching.
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('app-') && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, PAGE_CACHE, () => caches.match('/404.html', MATCH)))
  } else if (url.pathname.startsWith('/data/')) {
    event.respondWith(networkFirst(req, DATA_CACHE, () => undefined, true))
  } else {
    event.respondWith(caches.match(req, MATCH).then((hit) => hit ?? fetch(req)))
  }
})

/** The network's answer (saving a copy), or the saved copy when the network fails. */
async function networkFirst(req, cacheName, fallback, markOffline = false) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(req)
    if (res.ok) await cache.put(req, res.clone())
    return res
  } catch (err) {
    const saved = await cache.match(req, { ...MATCH, ignoreSearch: true })
    if (saved && markOffline) {
      const headers = new Headers(saved.headers)
      headers.set('X-Myteam-Offline', '1')
      return new Response(saved.body, { status: saved.status, headers })
    }
    const other = saved ?? (await fallback())
    if (other) return other
    throw err
  }
}
