// Parse basketball-reference team roster and player game log pages.

import * as cheerio from 'cheerio'
import type { StatTotals, TrackedGameType } from '../../src/lib/types.ts'

/** Some basketball-reference tables are shipped inside HTML comments; unwrap them. */
function load(html: string) {
  return cheerio.load(html.replace(/<!--|-->/g, ''))
}

export interface RosterEntry {
  id: string
  name: string
  number?: string
  position: string
  twoWay: boolean
}

export function parseRoster(html: string): RosterEntry[] {
  const $ = load(html)
  return $('#roster tbody tr')
    .toArray()
    .flatMap((row) => {
      const cell = (stat: string) => $(row).find(`[data-stat="${stat}"]`)
      const link = cell('player').find('a').first()
      const id = link.attr('href')?.match(/\/players\/\w\/(\w+)\.html/)?.[1]
      if (!id) return []
      const number = cell('number').text().trim()
      return [
        {
          id,
          name: link.text().trim(),
          ...(number && { number }),
          position: cell('pos').text().trim(),
          twoWay: /\(TW\)/.test(cell('player').text()),
        },
      ]
    })
}

export interface GameLogRow {
  /** The player's team's game number in the season (or playoffs). */
  teamGame: number
  started: boolean
  minutes: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  threeMade: number
  threeAttempted: number
  ftMade: number
  ftAttempted: number
}

const TABLES: { [K in TrackedGameType]: string } = {
  regular: 'player_game_log_reg',
  playoffs: 'player_game_log_post',
}

/** Games the player appeared in; inactive/DNP rows and the totals row are skipped. */
export function parseGameLog(html: string): { [K in TrackedGameType]: GameLogRow[] } {
  const $ = load(html)
  const parse = (tableId: string): GameLogRow[] =>
    $(`#${tableId} tbody tr[id]`)
      .toArray()
      .flatMap((row) => {
        const text = (stat: string) => $(row).find(`[data-stat="${stat}"]`).text().trim()
        const num = (stat: string) => Number(text(stat)) || 0
        const mp = text('mp')
        if (!mp) return []
        const [min, sec = '0'] = mp.split(':')
        return [
          {
            teamGame: num('team_game_num_season'),
            started: text('is_starter') === '*',
            minutes: Number(min) + Number(sec) / 60,
            points: num('pts'),
            rebounds: num('trb'),
            assists: num('ast'),
            steals: num('stl'),
            blocks: num('blk'),
            turnovers: num('tov'),
            fgMade: num('fg'),
            fgAttempted: num('fga'),
            threeMade: num('fg3'),
            threeAttempted: num('fg3a'),
            ftMade: num('ft'),
            ftAttempted: num('fta'),
          },
        ]
      })
  return { regular: parse(TABLES.regular), playoffs: parse(TABLES.playoffs) }
}

/** Sum game log rows, optionally only through a team game number. Undefined if no games. */
export function sumGameLog(rows: GameLogRow[], throughTeamGame = Infinity): StatTotals | undefined {
  const included = rows.filter((r) => r.teamGame <= throughTeamGame)
  if (!included.length) return undefined
  const total: StatTotals = {
    games: included.length,
    started: included.filter((r) => r.started).length,
    minutes: 0,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fgMade: 0,
    fgAttempted: 0,
    threeMade: 0,
    threeAttempted: 0,
    ftMade: 0,
    ftAttempted: 0,
  }
  for (const r of included) {
    for (const key of Object.keys(total) as (keyof StatTotals)[]) {
      if (key !== 'games' && key !== 'started') total[key] += r[key]
    }
  }
  total.minutes = Math.round(total.minutes * 10) / 10
  return total
}

export function gameLogUrl(playerId: string, seasonEndYear: number): string {
  return `https://www.basketball-reference.com/players/${playerId[0]}/${playerId}/gamelog/${seasonEndYear}`
}
