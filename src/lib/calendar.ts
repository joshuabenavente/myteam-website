// "Add to calendar": a one-event iCalendar (.ics) file for an upcoming game, made in the browser.
// No account, no subscription and no server. The time is the schedule's tip-off in UTC, so the
// calendar shows it in the person's own time zone; a time that changes later isn't updated.

import { channelsFor } from './channels.ts'
import { gamePath, SITE } from './seo.ts'
import { TEAMS_BY_ABBR } from './teams.ts'
import type { Game } from './types.ts'

/** A game is about this long, for the event's end. */
const GAME_MS = 2.5 * 3_600_000

/** 20261023T013000Z */
const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Escape text values (RFC 5545 §3.3.11). */
const text = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Lines over 75 bytes continue on the next line, starting with a space (RFC 5545 §3.1). */
function fold(line: string): string {
  const encoder = new TextEncoder()
  const out: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const n = encoder.encode(ch).length
    if (bytes + n > (out.length === 0 ? 75 : 74)) {
      out.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += n
  }
  out.push(current)
  return out.join('\r\n ')
}

/** Not offered for a game without a tip-off time yet, or one that has started. */
export const canAddToCalendar = (game: Pick<Game, 'status' | 'timeTbd'>) => game.status === 'scheduled' && !game.timeTbd

/** The .ics text for `game`, seen from the followed team `team` (NBA tricode). `now` stamps the file. */
export function gameIcs(game: Game, team: string, now = Date.now()): string {
  const us = TEAMS_BY_ABBR[team]
  const them = TEAMS_BY_ABBR[game.opponent]
  const [home, away] = game.home ? [us, them] : [them, us]
  const start = Date.parse(game.startUtc)
  const channels = channelsFor(game.broadcasts).map((c) => c.label)
  const url = `${SITE}${gamePath(us, game)}`
  const description = [game.label, channels.length ? `On: ${channels.join(', ')}` : undefined, url].filter(Boolean).join('\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//myteam.fans//NBA schedule//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${game.id}@myteam.fans`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(start + GAME_MS)}`,
    `SUMMARY:${text(`${away.name} at ${home.name}`)}`,
    ...(game.neutralSite ? [`LOCATION:${text(game.neutralSite)}`] : []),
    `DESCRIPTION:${text(description)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** "nuggets-at-thunder-2026-10-22.ics" */
export function gameIcsName(game: Game, team: string): string {
  const [home, away] = game.home ? [team, game.opponent] : [game.opponent, team]
  const slug = (abbr: string) => TEAMS_BY_ABBR[abbr].name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${slug(away)}-at-${slug(home)}-${game.startUtc.slice(0, 10)}.ics`
}
