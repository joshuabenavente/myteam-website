import { Resvg } from '@resvg/resvg-js'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { iconSvg } from './src/lib/brand.ts'
import { BRAND_DOT, NEUTRAL_THEME, teamTheme } from './src/lib/teamColors.ts'
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
 * GitHub Pages only serves files that exist. Write a copy of index.html for each team page
 * (/denver-nuggets, /denver-nuggets/players) with its own title, color, manifest and home screen
 * icon, and a 404.html that loads the app for deeper addresses (player and game pages).
 */
function teamPages(): Plugin {
  return {
    name: 'team-pages',
    apply: 'build',
    closeBundle() {
      const html = readFileSync(join(DIST, 'index.html'), 'utf8')
      const page = (title: string, color: string, slug?: string, key = 'app') =>
        html
          .replace(/<title>.*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="theme-color" content=")[^"]*/, `$1${color}`)
          .replace(/(<link rel="manifest" href=")[^"]*/, `$1/${slug ? `${slug}/` : ''}manifest.webmanifest`)
          .replace(/(<link rel="apple-touch-icon" href=")[^"]*/, `$1/icons/${key}-180.png`)
      const out = (path: string, content: string) => {
        mkdirSync(join(DIST, path), { recursive: true })
        writeFileSync(join(DIST, path, 'index.html'), content)
      }
      appFiles('app', undefined, BRAND_DOT, NEUTRAL_THEME.dark)
      for (const t of TEAMS) {
        const slug = teamSlug(t)
        const theme = teamTheme(t.abbr)
        const key = t.abbr.toLowerCase()
        appFiles(key, slug, theme.dot, theme.dark)
        out(slug, page(`${t.city} ${t.name} · myteam.fans`, theme.dark, slug, key))
        out(`${slug}/players`, page(`Roster · ${t.city} ${t.name} · myteam.fans`, theme.dark, slug, key))
      }
      out('teams', page('Pick your team · myteam.fans', NEUTRAL_THEME.dark))
      out('yesterday', page("Yesterday's games · myteam.fans", NEUTRAL_THEME.dark))
      out('today', page("Today's games · myteam.fans", NEUTRAL_THEME.dark))
      out('tomorrow', page("Tomorrow's games · myteam.fans", NEUTRAL_THEME.dark))
      writeFileSync(join(DIST, '404.html'), html)
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
