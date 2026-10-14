import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { teamTheme } from './src/lib/teamColors.ts'
import { TEAMS, teamSlug } from './src/lib/teams.ts'

/**
 * GitHub Pages only serves files that exist. Write a copy of index.html for each team page
 * (/denver-nuggets, /denver-nuggets/players) with its own title and color, and a 404.html that
 * loads the app for deeper addresses (player and game pages).
 */
function teamPages(): Plugin {
  return {
    name: 'team-pages',
    apply: 'build',
    closeBundle() {
      const dist = 'dist'
      const html = readFileSync(join(dist, 'index.html'), 'utf8')
      const page = (title: string, color: string) =>
        html
          .replace(/<title>.*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="theme-color" content=")[^"]*/, `$1${color}`)
      const out = (path: string, content: string) => {
        mkdirSync(join(dist, path), { recursive: true })
        writeFileSync(join(dist, path, 'index.html'), content)
      }
      for (const t of TEAMS) {
        const slug = teamSlug(t)
        const color = teamTheme(t.abbr).dark
        out(slug, page(`${t.city} ${t.name} · myteam.fans`, color))
        out(`${slug}/players`, page(`Roster · ${t.city} ${t.name} · myteam.fans`, color))
      }
      out('teams', page('Pick your team · myteam.fans', '#0f172a'))
      writeFileSync(join(dist, '404.html'), html)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // The site lives at the root of myteam.fans; pages are real paths (/denver-nuggets/players).
  base: '/',
  plugins: [react(), teamPages()],
})
