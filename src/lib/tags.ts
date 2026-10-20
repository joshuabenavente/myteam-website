// Matchup tags: short, checkable facts about an upcoming game, from data the site already loads
// (the schedule, standings, last season's results, availability and the league file). No
// opinions, predictions or odds, and most games get none. At most two are shown, in priority order.

import { availabilityLabel } from './availability.ts'
import type { AppData } from './data.ts'
import { dayKey } from './format.ts'
import { listedFor } from './hero.ts'
import { nameKey } from './names.ts'
import { TEAMS_BY_ABBR } from './teams.ts'
import type { Game } from './types.ts'

export interface Tag {
  id: string
  /** 1 (playoff stakes) to 8; lower is more important. */
  priority: number
  /** Short, plain text. */
  text: string
  /** A shorter wording for the narrow schedule rows, when `text` is long. */
  short?: string
  /** The numbers behind it, for a tooltip and screen readers. */
  title?: string
}

/** The most tags shown for one game. */
export const MAX_TAGS = 2
/** The schedule list only shows the stronger tags (priority 1-5), so most rows stay plain; the header shows them all. */
export const ROW_PRIORITY = 5

const DAY_MS = 86_400_000
/**
 * Standings, streaks and injuries describe today, so they only tag games in the next week; a
 * March game isn't described with October's standings.
 */
const SOON_MS = 7 * DAY_MS
/** Standings rules wait until each team has played this many games. */
const MIN_GAMES = 15
/** The scoring leaders: "top-10 scorers on both sides", and who counts as a star when out. */
const TOP_SCORERS = 10
const STAR_SCORERS = 15
/** Until a team has played this many games, last season's 50-win teams are a way to say who's good. */
const EARLY_GAMES = 20

type Input = Pick<AppData, 'schedule' | 'standings' | 'availability' | 'lastSeason' | 'league'>

/** "Gilgeous-Alexander", "Jackson" (for Jr.), for tags that fit on a phone. */
export function lastName(full: string): string {
  const parts = full.trim().split(/\s+/)
  while (parts.length > 1 && /^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(parts[parts.length - 1])) parts.pop()
  return parts[parts.length - 1]
}

const teamName = (abbr: string) => TEAMS_BY_ABBR[abbr]?.name ?? abbr

/**
 * The tags for a game that hasn't started, most important first, at most MAX_TAGS. `team` is the
 * followed team (the other is `game.opponent`); `now` is when the page is viewed.
 */
export function matchupTags({ game, team, data, now = Date.now() }: { game: Game; team: string; data: Input; now?: number }): Tag[] {
  if (game.status !== 'scheduled') return []
  const opp = game.opponent
  const soon = Date.parse(game.startUtc) - now <= SOON_MS
  const found: [number, Tag][] = []
  const add = (priority: number, tag: Omit<Tag, 'priority'>) => found.push([priority, { ...tag, priority }])
  const label = game.label ?? ''

  // 1. Playoff stakes (first seen in April; covered by tests).
  if (game.type === 'playin') add(1, { id: 'playin', text: 'Play-in game' })
  if (game.type === 'playoffs') {
    const series = label.match(/(?:leads|trails) (\d)-(\d)/)
    if (/\bGame 7\b/.test(label)) add(1, { id: 'game7', text: 'Game 7' })
    else if (series && Math.max(Number(series[1]), Number(series[2])) === 3) add(1, { id: 'elimination', text: 'Elimination game' })
  }

  // 2. Stakes in the standings.
  const us = data.standings.teams[team]
  const them = data.standings.teams[opp]
  const played = (t?: { wins: number; losses: number }) => (t ? t.wins + t.losses : 0)
  if (soon && us && them && played(us) >= MIN_GAMES && played(them) >= MIN_GAMES) {
    const apart = Math.abs(us.wins - them.wins + (them.losses - us.losses)) / 2
    if (us.conferenceRank <= 4 && them.conferenceRank <= 4) {
      add(2, {
        id: 'top4',
        text: 'Both top-4 seeds',
        title: `${teamName(team)} are #${us.conferenceRank} in the ${us.conference}; ${teamName(opp)} are #${them.conferenceRank} in the ${them.conference}.`,
      })
    }
    if (us.division === them.division && us.divisionRank + them.divisionRank === 3 && apart <= 2) {
      add(2, { id: 'division', text: 'Division lead on the line', title: `${us.division} Division: first and second, ${apart} ${apart === 1 ? 'game' : 'games'} apart.` })
    }
    if (
      us.conference === them.conference &&
      played(us) >= 55 && played(them) >= 55 &&
      us.conferenceRank >= 6 && us.conferenceRank <= 10 && them.conferenceRank >= 6 && them.conferenceRank <= 10 &&
      apart <= 2
    ) {
      add(2, { id: 'playin-race', text: 'Play-in race', title: `Ranked #${us.conferenceRank} and #${them.conferenceRank} in the ${us.conference}, within 2 games.` })
    }
  }

  // 3. Last season's playoff meeting.
  const met = (data.lastSeason?.games ?? []).filter((g) => g.type === 'playoffs' && ((g.home === team && g.away === opp) || (g.home === opp && g.away === team)))
  if (met.length > 0) {
    const won = (abbr: string) => met.filter((g) => (g.home === abbr ? g.homeScore > g.awayScore : g.awayScore > g.homeScore)).length
    const [a, b] = [won(team), won(opp)]
    if (a !== b) {
      add(3, {
        id: 'rematch',
        text: `Last season's playoff rematch · ${a > b ? team : opp} won ${Math.max(a, b)}-${Math.min(a, b)}`,
        short: 'Playoff rematch',
        title: `They met in the ${data.lastSeason?.season} playoffs.`,
      })
    }
  }

  // 4. A top scorer who's out or day-to-day (the league's top 15 by points per game).
  const scorers = data.league?.scorers ?? []
  const season = data.league?.scoringSeason ?? ''
  if (soon) {
    for (const abbr of [team, opp]) {
      for (const absence of listedFor(data.availability?.teams[abbr], game)) {
        const rank = scorers.findIndex((s) => s.team === abbr && nameKey(s.name) === nameKey(absence.name)) + 1
        if (rank === 0 || rank > STAR_SCORERS) continue
        const status = availabilityLabel(absence).toLowerCase()
        add(4, {
          id: 'star-out',
          text: `${lastName(absence.name)} ${abbr === team ? '' : `(${abbr}) `}is ${status}`,
          title: `${absence.name}, #${rank} in the league at ${scorers[rank - 1].ppg} points per game in ${season}, is ${status}${absence.reason ? ` · ${absence.reason}` : ''}.`,
        })
      }
    }
  }

  // 5. The schedule's own moments.
  if (game.type === 'regular') {
    const regular = data.schedule.games.filter((g) => g.type === 'regular')
    const firstHome = regular.find((g) => g.home)
    if (regular[0]?.id === game.id) add(5, { id: 'opener', text: game.home ? 'Season and home opener' : 'Season opener' })
    else if (firstHome?.id === game.id) add(5, { id: 'opener', text: 'Home opener' })
    if (regular.at(-1)?.id === game.id) add(5, { id: 'finale', text: 'Regular-season finale' })
    if (/NBA Cup/.test(label)) add(5, { id: 'cup', text: label.replace(/^Emirates\s+/, '') })
    else if (/Rivals Week/.test(label)) add(5, { id: 'rivals', text: 'Rivals Week' })
    if (game.neutralSite) add(5, { id: 'neutral', text: `Neutral site · ${game.neutralSite}` })
    if (dayKey(game.startUtc, 'America/New_York').slice(5) === '12-25') add(5, { id: 'christmas', text: 'Christmas Day' })
  }

  // 6. Two of the league's top-10 scorers.
  const best = (abbr: string) => {
    const i = scorers.findIndex((s) => s.team === abbr)
    return i >= 0 && i < TOP_SCORERS ? scorers[i] : undefined
  }
  const [mine, theirs] = [best(team), best(opp)]
  if (mine && theirs) {
    add(6, {
      id: 'scorers',
      text: `Top-10 scorers: ${lastName(mine.name)}, ${lastName(theirs.name)}`,
      title: `${mine.name} ${mine.ppg} and ${theirs.name} ${theirs.ppg} points per game in ${season}.`,
    })
  }

  // 7. Streaks.
  if (soon && us && them && played(us) >= MIN_GAMES && played(them) >= MIN_GAMES) {
    const streak = (t: { streak?: string }) => {
      const m = t.streak?.match(/^([WL])(\d+)$/)
      return m ? { won: m[1] === 'W', n: Number(m[2]) } : undefined
    }
    const [a, b] = [streak(us), streak(them)]
    const run = (abbr: string, s: { won: boolean; n: number }) => `${teamName(abbr)} ${s.won ? 'W' : 'L'}${s.n}`
    if (a && b) {
      if (a.won && b.won && Math.min(a.n, b.n) >= 5) add(7, { id: 'streaks', text: `Hot streaks: ${run(team, a)}, ${run(opp, b)}` })
      else if ((a.won && a.n >= 6 && !b.won && b.n >= 4) || (b.won && b.n >= 6 && !a.won && a.n >= 4)) add(7, { id: 'streaks', text: `Streak on the line: ${run(team, a)}, ${run(opp, b)}` })
    }
    for (const [abbr, s] of [[team, a], [opp, b]] as const) {
      if (s?.won && s.n >= 8) add(7, { id: 'streak', text: `${teamName(abbr)} have won ${s.n} straight` })
    }
  }

  // 8. Before the standings say much: last season's 50-win teams.
  const wins = data.league?.lastWins
  const gameNumber = data.schedule.games.filter((g) => g.type === 'regular' && g.startUtc <= game.startUtc).length
  if (game.type === 'regular' && gameNumber <= EARLY_GAMES && wins && wins[team] >= 50 && wins[opp] >= 50) {
    add(8, { id: 'wins', text: 'Both won 50+ games last season', title: `${teamName(team)} won ${wins[team]} and ${teamName(opp)} won ${wins[opp]} last season.` })
  }

  return found
    .map(([priority, tag], i) => ({ priority, tag, i }))
    .sort((x, y) => x.priority - y.priority || x.i - y.i)
    .slice(0, MAX_TAGS)
    .map((x) => x.tag)
}
