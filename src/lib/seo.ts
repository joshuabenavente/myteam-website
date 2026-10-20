// Search and sharing: each page's title, description and canonical address, and the plain-HTML
// snapshot the build writes into each page (SEO-02 to SEO-08). The build (vite.config.ts) and the
// app use the same functions, so the static page and the running app agree.
//
// URL policy: https://myteam.fans, no trailing slash. /teams is the same picker as / and points to
// it. A game has a page under each team; the home team's is the canonical one.

import { ordinal } from './format.ts'
import type { Game, Player, PlayersFile, PreviewsFile, StandingsFile, StatTotals } from './types.ts'
import { TEAMS, TEAMS_BY_ABBR, teamSlug, type Team } from './teams.ts'

export const SITE = 'https://myteam.fans'

/** Dates in titles and snapshots: the NBA's own time zone, so they don't depend on the reader. */
const LEAGUE_TZ = 'America/New_York'

export interface Head {
  title: string
  description: string
  /** Canonical path, e.g. "/denver-nuggets/players". */
  path: string
}

const fullName = (t: Pick<Team, 'city' | 'name'>) => `${t.city} ${t.name}`
const team = (abbr: string) => TEAMS_BY_ABBR[abbr]

export const teamPath = (t: Team) => `/${teamSlug(t)}`

/** The two teams of a game seen from `us`, by NBA designation (neutral-site games too). */
function sides(us: Team, g: Game) {
  const them = team(g.opponent)
  return g.home ? { home: us, away: them } : { home: them, away: us }
}

/** The canonical page of a game: under the home team. */
export const gamePath = (us: Team, g: Pick<Game, 'id' | 'home' | 'opponent'>) =>
  `${teamPath(g.home ? us : team(g.opponent))}/games/${g.id}`

export const gameDate = (g: Pick<Game, 'startUtc'>, withYear = true) =>
  new Date(g.startUtc).toLocaleDateString('en-US', {
    weekday: withYear ? undefined : 'short',
    month: 'short',
    day: 'numeric',
    year: withYear ? 'numeric' : undefined,
    timeZone: LEAGUE_TZ,
  })

const gameTime = (g: Game) =>
  g.timeTbd ? 'time TBD' : `${new Date(g.startUtc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: LEAGUE_TZ })} ET`

/** "Final: Denver Nuggets 121, Golden State Warriors 112" style score, home team second. */
function finalLine(us: Team, g: Game) {
  if (!g.score) return undefined
  const { home, away } = sides(us, g)
  const [homeScore, awayScore] = g.home ? [g.score.team, g.score.opponent] : [g.score.opponent, g.score.team]
  return `${fullName(away)} ${awayScore}, ${fullName(home)} ${homeScore}`
}

/** Per-game line for a player, from the season that has games. */
function seasonLine(p: Player, players: Pick<PlayersFile, 'season' | 'lastSeason'>): { season: string; s: StatTotals } | undefined {
  if (p.current.regular?.games) return { season: players.season, s: p.current.regular }
  if (p.lastFull.regular?.games) return { season: players.lastSeason, s: p.lastFull.regular }
  return undefined
}
const perGame = (n: number, games: number) => (n / games).toFixed(1)
const averages = ({ s }: { s: StatTotals }) =>
  `${perGame(s.points, s.games)} points, ${perGame(s.rebounds, s.games)} rebounds and ${perGame(s.assists, s.games)} assists per game`

// ---- Heads -------------------------------------------------------------------------------------

export const pickerHead = (): Head => ({
  title: 'NBA Team Schedules, Scores & Stats · myteam.fans',
  description: 'Pick any NBA team to follow its schedule, live scores, TV channels, injuries, roster and player stats. No ads, no bets.',
  path: '/',
})

export function teamHead(t: Team, season: string, games: Game[], now = new Date()): Head {
  const next = games.find((g) => g.status !== 'final' && new Date(g.startUtc) > new Date(now.getTime() - 4 * 3600_000))
  const nextText = next ? ` Next: ${gameDate(next)} ${next.home ? 'vs' : 'at'} ${fullName(team(next.opponent))}.` : ''
  return {
    title: `${fullName(t)} Schedule & Scores ${season} · myteam.fans`,
    description: `The ${fullName(t)} ${season} schedule with scores, TV channels, injuries and standings.${nextText}`,
    path: teamPath(t),
  }
}

export function rosterHead(t: Team, players: PlayersFile): Head {
  const names = players.players.slice(0, 3).map((p) => p.name)
  return {
    title: `${fullName(t)} Roster & Player Stats ${players.season} · myteam.fans`,
    description: `The ${fullName(t)} ${players.season} roster${names.length ? `, including ${names.join(', ')},` : ''} with per-game stats and game logs.`,
    path: `${teamPath(t)}/players`,
  }
}

export function playerHead(t: Team, p: Player, players: PlayersFile): Head {
  const line = seasonLine(p, players)
  return {
    title: `${p.name} Stats & Game Log · ${fullName(t)} · myteam.fans`,
    description:
      `${p.name} (${[p.number && `#${p.number}`, p.position].filter(Boolean).join(', ')}) of the ${fullName(t)}.` +
      (line ? ` ${line.season}: ${averages(line)} in ${line.s.games} games.` : ' No NBA games yet.'),
    path: `${teamPath(t)}/players/${p.id}`,
  }
}

export function gameHead(us: Team, g: Game): Head {
  const { home, away } = sides(us, g)
  const what = g.status === 'final' ? 'Box Score' : g.status === 'live' ? 'Score' : 'Preview'
  const where = g.neutralSite ? ` in ${g.neutralSite}` : ''
  const final = finalLine(us, g)
  return {
    title: `${away.name} at ${home.name} ${what} · ${gameDate(g)} · myteam.fans`,
    description:
      g.status === 'final' && final
        ? `Final: ${final} (${gameDate(g)}${where}). Box score and play-by-play.`
        : `${fullName(away)} at ${fullName(home)}, ${gameDate(g)}, ${gameTime(g)}${where}` +
          `${g.broadcasts.length ? ` on ${g.broadcasts.map((b) => b.name).join(', ')}` : ''}. Preview, injuries and TV channels.`,
    path: gamePath(us, g),
  }
}

// ---- Static HTML -------------------------------------------------------------------------------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`
const list = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

/** The picture shown with shared links, written by the build (vite.config.ts). */
export const SHARE_IMAGE = { path: '/share.png', width: 1200, height: 630 }

/** Only on the picker: the site's name and address for search engines (SEO-09). */
export const websiteJsonLd = () => ({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'myteam.fans', url: `${SITE}/` })

/** Head tags for a page; replaces the shell's title and description. Includes sharing tags (SEO-10). */
export function headTags(head: Head, { jsonLd }: { jsonLd?: object } = {}): string {
  const url = `${SITE}${head.path}`
  const og = (property: string, content: string | number) => `<meta property="og:${property}" content="${esc(String(content))}" />`
  return [
    `<title>${esc(head.title)}</title>`,
    `<meta name="description" content="${esc(head.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    og('type', 'website'),
    og('site_name', 'myteam.fans'),
    og('title', head.title.replace(/ · myteam\.fans$/, '')),
    og('description', head.description),
    og('url', url),
    og('image', `${SITE}${SHARE_IMAGE.path}`),
    og('image:width', SHARE_IMAGE.width),
    og('image:height', SHARE_IMAGE.height),
    og('image:alt', 'myteam.fans'),
    `<meta name="twitter:card" content="summary_large_image" />`,
    // JSON in a script element: escape "<" so the data can't close it.
    ...(jsonLd ? [`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n    ')
}

const asOf = (updatedAt: string) =>
  `<p class="snapshot-asof">Updated ${esc(
    new Date(updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: LEAGUE_TZ }),
  )} ET</p>`

const snapshot = (body: string, updatedAt?: string) =>
  `<div class="snapshot">${body}${updatedAt ? asOf(updatedAt) : ''}</div>`

export function pickerSnapshot(): string {
  const conf = (c: 'East' | 'West') =>
    `<h2>${c}ern Conference</h2>` + list(TEAMS.filter((t) => t.conference === c).map((t) => link(teamPath(t), fullName(t))))
  return snapshot(`<h1>Pick your NBA team</h1><p>${esc(pickerHead().description)}</p>${conf('East')}${conf('West')}`)
}

const gameItem = (us: Team, g: Game) => {
  const result =
    g.status === 'final' && g.score ? ` · ${g.score.team > g.score.opponent ? 'W' : 'L'} ${g.score.team}-${g.score.opponent}` : ''
  return `${link(`${teamPath(us)}/games/${g.id}`, `${gameDate(g, false)} ${g.home ? 'vs' : 'at'} ${fullName(team(g.opponent))}`)}${esc(result)}`
}

export function teamSnapshot(t: Team, season: string, games: Game[], standings: StandingsFile['teams'], updatedAt: string, now = new Date()): string {
  const s = standings[t.abbr]
  const played = s && s.wins + s.losses > 0
  const record = played ? `<p>${season} record: ${s.wins}-${s.losses}, ${ordinal(s.conferenceRank)} in the ${s.conference}.</p>` : ''
  const head = teamHead(t, season, games, now)
  return snapshot(
    `<h1>${esc(fullName(t))}</h1><p>${esc(head.description)}</p>${record}` +
      `<p>${link(`${teamPath(t)}/players`, `${fullName(t)} roster and player stats`)}</p>` +
      `<h2>${esc(season)} schedule</h2>${list(games.map((g) => gameItem(t, g)))}`,
    updatedAt,
  )
}

export function rosterSnapshot(t: Team, players: PlayersFile, updatedAt: string): string {
  const current = players.players.some((p) => p.current.regular?.games)
  const note = current ? `Stats: ${players.season} regular season.` : `Stats: ${players.lastSeason} regular season, until ${players.season} games are played (some with other teams).`
  const item = (p: Player) => {
    const line = seasonLine(p, players)
    const s = line?.s
    return (
      link(`${teamPath(t)}/players/${p.id}`, p.name) +
      esc(` · ${[p.number && `#${p.number}`, p.position].filter(Boolean).join(' · ')}`) +
      (s ? esc(` · ${perGame(s.points, s.games)} PTS, ${perGame(s.rebounds, s.games)} REB, ${perGame(s.assists, s.games)} AST`) : '')
    )
  }
  return snapshot(
    `<h1>${esc(fullName(t))} roster · ${esc(players.season)}</h1><p>${esc(note)}</p>${list(players.players.map(item))}` +
      `<p>${link(teamPath(t), `${fullName(t)} schedule`)}</p>`,
    updatedAt,
  )
}

export function playerSnapshot(t: Team, p: Player, players: PlayersFile, updatedAt: string): string {
  const line = seasonLine(p, players)
  const bio = [p.bio.height, p.bio.weight && `${p.bio.weight} lb`, p.bio.college, p.bio.birthPlace && `born in ${p.bio.birthPlace}`].filter(Boolean)
  return snapshot(
    `<h1>${esc(p.name)}</h1>` +
      `<p>${esc([p.number && `#${p.number}`, p.position, fullName(t)].filter(Boolean).join(' · '))}</p>` +
      (bio.length ? `<p>${esc(bio.join(' · '))}</p>` : '') +
      `<p>${esc(line ? `${line.season} regular season: ${averages(line)} in ${line.s.games} games.` : 'No NBA games yet.')}</p>` +
      `<p>${link(`${teamPath(t)}/players`, `${fullName(t)} roster`)} · ${link(teamPath(t), `${fullName(t)} schedule`)}</p>`,
    updatedAt,
  )
}

export function gameSnapshot(us: Team, g: Game, previews: PreviewsFile | undefined, updatedAt: string): string {
  const { home, away } = sides(us, g)
  const final = finalLine(us, g)
  const status =
    g.status === 'final' && final ? `Final: ${final}.` : g.status === 'live' ? 'In progress.' : `${gameDate(g)}, ${gameTime(g)}.`
  const preview = g.status === 'scheduled' ? previews?.games[g.id]?.text : undefined
  return snapshot(
    `<h1>${esc(`${fullName(away)} at ${fullName(home)}`)}</h1>` +
      (g.label ? `<p>${esc(g.label)}</p>` : '') +
      `<p>${esc(status)}${g.neutralSite ? esc(` In ${g.neutralSite}.`) : ''}</p>` +
      (g.status !== 'final' && g.broadcasts.length ? `<p>${esc(`TV and radio: ${g.broadcasts.map((b) => b.name).join(', ')}`)}</p>` : '') +
      (preview ? `<p>${esc(preview)}</p>` : '') +
      `<p>${link(teamPath(away), `${fullName(away)} schedule`)} · ${link(teamPath(home), `${fullName(home)} schedule`)}</p>`,
    updatedAt,
  )
}

// ---- Sitemap -----------------------------------------------------------------------------------

export interface SitemapEntry {
  path: string
  /** ISO date of the last real content change, when known. */
  lastmod?: string
}

/** Games worth listing: finished ones and those in the next 14 days (owner decision D4). */
export const sitemapGame = (g: Game, now: Date) =>
  g.status === 'final' || new Date(g.startUtc).getTime() - now.getTime() < 14 * 86_400_000

export function sitemapXml(entries: SitemapEntry[]): string {
  const url = (e: SitemapEntry) =>
    `  <url><loc>${SITE}${esc(e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(url).join('\n')}\n</urlset>\n`
}

export const robotsTxt = () => `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`

