// Parse basketball-reference team roster and player game log pages.

import * as cheerio from 'cheerio'
import type { GameLogEntry, PlayerBio, TrackedGameType } from '../../src/lib/types.ts'

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
  bio: PlayerBio
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
          bio: rosterBio(cell),
        },
      ]
    })
}

function rosterBio(cell: (stat: string) => { text(): string; attr(name: string): string | undefined }): PlayerBio {
  const text = (stat: string) => cell(stat).text().trim()
  const birth = cell('birth_date').attr('csk')
  const weight = Number(text('weight'))
  const exp = text('years_experience')
  return {
    ...(text('height') && { height: text('height').replace('-', "' ") + '"' }),
    ...(weight && { weight }),
    ...(birth?.length === 8 && { birthDate: `${birth.slice(0, 4)}-${birth.slice(4, 6)}-${birth.slice(6)}` }),
    ...(exp && { experience: exp === 'R' ? 0 : Number(exp) }),
    ...(text('college') && { college: text('college') }),
  }
}

// basketball-reference abbreviations that differ from NBA tricodes.
const BBREF_TO_NBA: { [abbr: string]: string } = { PHO: 'PHX', BRK: 'BKN', CHO: 'CHA' }

export type GameLogRow = GameLogEntry

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
            date: text('date'),
            opponent: BBREF_TO_NBA[text('opp_name_abbr')] ?? text('opp_name_abbr'),
            home: text('game_location') !== '@',
            result: text('game_result').startsWith('W') ? 'W' : 'L',
            score: text('game_result').replace(/^[WL],\s*/, ''),
            started: text('is_starter') === '*',
            minutes: Math.round((Number(min) + Number(sec) / 60) * 10) / 10,
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

export function gameLogUrl(playerId: string, seasonEndYear: number): string {
  return `https://www.basketball-reference.com/players/${playerId[0]}/${playerId}/gamelog/${seasonEndYear}`
}
