import { describe, expect, it } from 'vitest'
import { gameHead, gamePath, gameSnapshot, headTags, pickerSnapshot, playerHead, rosterSnapshot, sitemapGame, sitemapXml, teamHead } from './seo'
import { TEAMS_BY_ABBR } from './teams'
import type { Game, Player, PlayersFile } from './types'

const DEN = TEAMS_BY_ABBR.DEN
const LAL = TEAMS_BY_ABBR.LAL

const game = (over: Partial<Game> = {}): Game => ({
  id: '0022600010',
  type: 'regular',
  startUtc: '2026-10-23T02:00:00Z',
  home: true,
  opponent: 'LAL',
  status: 'scheduled',
  broadcasts: [{ name: 'ESPN', scope: 'national', kind: 'tv' }],
  ...over,
})

const stats = (games: number) => ({ games, started: games, minutes: 30 * games, points: 25 * games, rebounds: 10 * games, assists: 8 * games, steals: 0, blocks: 0, turnovers: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0 })
const player = (over: Partial<Player> = {}): Player => ({
  id: 'jokicni01',
  name: 'Nikola Jokić',
  number: '15',
  position: 'C',
  twoWay: false,
  bio: {},
  current: {},
  lastFull: { regular: stats(70) },
  lastToDate: {},
  ...over,
})
const players = (list: Player[]): PlayersFile => ({ season: '2026-27', lastSeason: '2025-26', teamGamesPlayed: { regular: 0, playoffs: 0 }, players: list })

describe('canonical addresses', () => {
  it('puts a game under its home team, from either side', () => {
    expect(gamePath(DEN, game())).toBe('/denver-nuggets/games/0022600010')
    expect(gamePath(LAL, game({ home: false, opponent: 'DEN' }))).toBe('/denver-nuggets/games/0022600010')
    expect(gameHead(LAL, game({ home: false, opponent: 'DEN' })).path).toBe('/denver-nuggets/games/0022600010')
  })

  it('writes absolute, slashless canonicals', () => {
    expect(headTags(teamHead(DEN, '2026-27', []))).toContain('<link rel="canonical" href="https://myteam.fans/denver-nuggets" />')
  })
})

describe('titles and descriptions', () => {
  it('names the game, its date in Eastern time and what the page has', () => {
    // 10 PM ET on Oct 22 is Oct 23 in UTC.
    expect(gameHead(DEN, game()).title).toBe('Lakers at Nuggets Preview · Oct 22, 2026 · myteam.fans')
    const final = gameHead(DEN, game({ status: 'final', score: { team: 121, opponent: 112 } }))
    expect(final.title).toBe('Lakers at Nuggets Box Score · Oct 22, 2026 · myteam.fans')
    expect(final.description).toContain('Final: Los Angeles Lakers 112, Denver Nuggets 121')
  })

  it("labels last season's stats as last season's", () => {
    const head = playerHead(DEN, player(), players([player()]))
    expect(head.title).toBe('Nikola Jokić Stats & Game Log · Denver Nuggets · myteam.fans')
    expect(head.description).toContain('2025-26: 25.0 points, 10.0 rebounds and 8.0 assists per game in 70 games')
  })

  it('mentions the next game on the team page', () => {
    const head = teamHead(DEN, '2026-27', [game()], new Date('2026-10-20T00:00:00Z'))
    expect(head.description).toContain('Next: Oct 22, 2026 vs Los Angeles Lakers.')
  })
})

describe('snapshots', () => {
  it('escapes data', () => {
    const html = gameSnapshot(DEN, game(), { games: { '0022600010': { text: 'A <b>big</b> one & more', generatedAt: '', factsHash: '' } } }, '2026-10-20T04:00:00Z')
    expect(html).toContain('A &lt;b&gt;big&lt;/b&gt; one &amp; more')
  })

  it('links the picker to all 30 teams and the roster to its players', () => {
    expect(pickerSnapshot().match(/<a href=/g)).toHaveLength(30)
    expect(rosterSnapshot(DEN, players([player()]), '2026-10-20T04:00:00Z')).toContain('<a href="/denver-nuggets/players/jokicni01">Nikola Jokić</a>')
  })

  it("never shows a live score, only that it's in progress", () => {
    expect(gameSnapshot(DEN, game({ status: 'live', score: { team: 50, opponent: 48 } }), undefined, '2026-10-20T04:00:00Z')).not.toContain('50')
  })
})

describe('sitemap', () => {
  const now = new Date('2026-10-20T00:00:00Z')
  it('lists finals and games in the next 14 days', () => {
    expect(sitemapGame(game({ status: 'final' }), now)).toBe(true)
    expect(sitemapGame(game({ startUtc: '2026-11-02T00:00:00Z' }), now)).toBe(true)
    expect(sitemapGame(game({ startUtc: '2026-11-04T01:00:00Z' }), now)).toBe(false)
  })

  it('writes valid entries', () => {
    expect(sitemapXml([{ path: '/denver-nuggets', lastmod: '2026-10-20T04:00:00Z' }])).toContain(
      '<url><loc>https://myteam.fans/denver-nuggets</loc><lastmod>2026-10-20</lastmod></url>',
    )
  })
})
