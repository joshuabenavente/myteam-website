import { Resvg } from '@resvg/resvg-js'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { iconSvg, shareImageSvg } from './src/lib/brand.ts'
import {
  gameHead,
  gameSnapshot,
  headTags,
  pickerHead,
  pickerSnapshot,
  playerHead,
  playerSnapshot,
  rosterHead,
  robotsTxt,
  rosterSnapshot,
  SHARE_IMAGE,
  sitemapGame,
  sitemapXml,
  teamHead,
  teamSnapshot,
  websiteJsonLd,
  type Head,
  type SitemapEntry,
} from './src/lib/seo.ts'
import type { MetaFile, PlayersFile, PreviewsFile, ScheduleFile, StandingsFile } from './src/lib/types.ts'
import { BRAND_DOT, NEUTRAL_THEME, teamTheme, type TeamTheme } from './src/lib/teamColors.ts'
import { TEAMS, teamSlug } from './src/lib/teams.ts'

const DIST = 'dist'

const png = (svg: string, size: number) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()

/**
 * The installable app: icons with the team's dot, a manifest per team, and the service worker.
 * Installing from a team's page gives the app that team's dot (fixed at install); the team
 * picker and deeper pages start out neutral, and the page swaps in the team's icon at runtime.
 */
function appFiles(key: string, slug: string | undefined, dot: string, color: string) {
  mkdirSync(join(DIST, 'icons'), { recursive: true })
  const icon = (name: string, size: number, fullBleed = false) =>
    writeFileSync(join(DIST, 'icons', `${key}-${name}.png`), png(iconSvg(dot, { fullBleed }), size))
  icon('192', 192)
  icon('512', 512)
  icon('maskable-512', 512, true)
  // iPhones round the corners themselves.
  icon('180', 180, true)
  const manifest = {
    id: '/',
    name: 'myteam.fans',
    short_name: 'myteam.fans',
    description: "Your NBA team's schedule, live scores, injuries and player stats.",
    // The home page goes to the team you follow.
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: color,
    theme_color: color,
    icons: [
      { src: `/icons/${key}-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/icons/${key}-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `/icons/${key}-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  const dir = slug ? join(DIST, slug) : DIST
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2))
}

/** The service worker, with this build's files to save for offline use. */
function serviceWorker() {
  const assets = readdirSync(join(DIST, 'assets')).map((f) => `/assets/${f}`)
  const precache = ['/404.html', '/favicon.svg', ...assets]
  const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)
  const sw = readFileSync('pwa/sw.js', 'utf8')
    .replace("'__VERSION__'", JSON.stringify(version))
    .replace('__PRECACHE__', JSON.stringify(precache))
  writeFileSync(join(DIST, 'sw.js'), sw)
}

/**
 * The page's colors in its HTML, the same ones applyTheme (src/lib/team.ts) sets, so the first
 * paint is already in the team's colors (or the picker's) instead of the stylesheet's defaults.
 */
const themeStyle = (t: TeamTheme) =>
  `<style>:root{--midnight:${t.dark};--skyline:${t.mid};--sunshine:${t.accent};--accent-text:${t.accentText};` +
  `--team-dot:${t.dot};--link:${t.link};--link-dark:${t.linkDark}}</style>`

const readJson = <T,>(path: string): T | undefined => {
  try {
    return JSON.parse(readFileSync(join(DIST, 'data', path), 'utf8')) as T
  } catch {
    return undefined
  }
}

/**
 * GitHub Pages only serves files that exist. Write a page for every address the app has: the
 * picker, each team's games and roster, and each current player and game (SEO-02). Each page has
 * its own title, description and canonical address, and a plain-HTML snapshot of its content
 * that the app replaces when it starts (src/lib/seo.ts). Pages are written as /x.html, which
 * GitHub Pages serves at /x without a redirect, and as /x/index.html where /x/ has pages below
 * it. 404.html loads the app for anything else and is kept out of search results.
 */
function teamPages(): Plugin {
  return {
    name: 'team-pages',
    apply: 'build',
    closeBundle() {
      const html = readFileSync(join(DIST, 'index.html'), 'utf8')
      const page = (head: Head, body: string, theme: TeamTheme, slug?: string, key = 'app', jsonLd?: object) =>
        html
          .replace('</head>', () => `  ${themeStyle(theme)}\n  </head>`)
          .replace(/\s*<meta name="description"[^>]*>/, '')
          .replace(/<title>.*<\/title>/, () => headTags(head, { jsonLd }))
          .replace(/(<meta name="theme-color" content=")[^"]*/, `$1${theme.dark}`)
          .replace(/(<link rel="manifest" href=")[^"]*/, `$1/${slug ? `${slug}/` : ''}manifest.webmanifest`)
          .replace(/(<link rel="apple-touch-icon" href=")[^"]*/, `$1/icons/${key}-180.png`)
          .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)
      // "/x" -> x.html; with `folder`, also x/index.html for the "/x/" address.
      const out = (path: string, content: string, folder = false) => {
        mkdirSync(join(DIST, path, '..'), { recursive: true })
        writeFileSync(join(DIST, `${path}.html`), content)
        if (folder) {
          mkdirSync(join(DIST, path), { recursive: true })
          writeFileSync(join(DIST, path, 'index.html'), content)
        }
      }

      const meta = readJson<MetaFile>('meta.json')
      const standings = readJson<StandingsFile>('standings.json')?.teams ?? {}
      const updatedAt = meta?.updatedAt ?? new Date().toISOString()
      const now = new Date()
      let count = 0
      // Canonical, indexable pages only (SEO-06): no /teams, no away-team copies of games.
      const sitemap: SitemapEntry[] = [{ path: '/' }]
      const latest = (dates: string[]) => dates.sort().at(-1)

      appFiles('app', undefined, BRAND_DOT, NEUTRAL_THEME.dark)
      const picker = page(pickerHead(), pickerSnapshot(), NEUTRAL_THEME, undefined, 'app', websiteJsonLd())
      writeFileSync(join(DIST, 'index.html'), picker)
      out('teams', picker, true)
      for (const t of TEAMS) {
        const slug = teamSlug(t)
        const theme = teamTheme(t.abbr)
        const key = t.abbr.toLowerCase()
        const teamPage = (head: Head, body: string) => page(head, body, theme, slug, key)
        appFiles(key, slug, theme.dot, theme.dark)
        const schedule = readJson<ScheduleFile>(`teams/${key}/schedule.json`)
        const players = readJson<PlayersFile>(`teams/${key}/players.json`)
        const previews = readJson<PreviewsFile>(`teams/${key}/previews.json`)
        const season = schedule?.season ?? meta?.season ?? ''
        const games = schedule?.games ?? []
        const finals = games.filter((g) => g.status === 'final').map((g) => g.startUtc)
        // Stats change only once games are played; before that, a refresh isn't new content.
        const statsDate = players && players.teamGamesPlayed.regular + players.teamGamesPlayed.playoffs > 0 ? players.updatedAt : undefined
        out(slug, teamPage(teamHead(t, season, games, now), teamSnapshot(t, season, games, standings, updatedAt, now)), true)
        sitemap.push({ path: `/${slug}`, lastmod: latest(finals) })
        if (players) {
          out(`${slug}/players`, teamPage(rosterHead(t, players), rosterSnapshot(t, players, updatedAt)), true)
          sitemap.push({ path: `/${slug}/players`, lastmod: statsDate })
        }
        for (const p of players?.players ?? []) {
          out(`${slug}/players/${p.id}`, teamPage(playerHead(t, p, players!), playerSnapshot(t, p, players!, updatedAt)))
          sitemap.push({ path: `/${slug}/players/${p.id}`, lastmod: statsDate })
          count++
        }
        for (const g of games) {
          out(`${slug}/games/${g.id}`, teamPage(gameHead(t, g), gameSnapshot(t, g, previews, updatedAt)))
          if (g.home && sitemapGame(g, now)) sitemap.push({ path: `/${slug}/games/${g.id}`, lastmod: g.status === 'final' ? g.startUtc : undefined })
          count++
        }
      }
      // Unknown addresses: the app shell, which says the page wasn't found.
      writeFileSync(
        join(DIST, '404.html'),
        html
          .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />')
          .replace(/(<meta name="theme-color" content=")[^"]*/, `$1${NEUTRAL_THEME.dark}`)
          .replace('</head>', () => `  ${themeStyle(NEUTRAL_THEME)}\n  </head>`),
      )
      writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml(sitemap))
      writeFileSync(join(DIST, 'robots.txt'), robotsTxt())
      writeFileSync(join(DIST, SHARE_IMAGE.path), new Resvg(shareImageSvg(BRAND_DOT)).render().asPng())
      console.log(`team-pages: ${count} player and game pages; ${sitemap.length} in the sitemap`)
      serviceWorker()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // The site lives at the root of myteam.fans; pages are real paths (/denver-nuggets/players).
  base: '/',
  plugins: [react(), teamPages()],
})
