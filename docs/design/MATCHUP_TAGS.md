# Matchup tags

**Status: built and deployed October 20, 2026 (v1).** The owner approved the draft below with its
suggested answers to D1–D5. The rules live in `src/lib/tags.ts` (tested in `tags.test.ts`); league-wide
facts come from `public/data/league.json`, written by the hourly data run (`scripts/lib/league.ts`,
or `npm run league`).

## As built (differences from the draft)

- **All twelve tags are in** (M-12, "Both won 50+ games last season", only for a team's first 20 games).
- **Standings, streak and star-availability tags apply only to games in the next 7 days**, so a March
  game is never described with October's standings or an October injury report.
- **Where they show:** up to two in the header's old pill spot (before tip-off), and **one in each
  upcoming game's row**, only the stronger kinds (priority 1–5: playoff stakes, standings stakes,
  rematch, star availability, openers and events). Rows use a short wording where the text is long
  ("Playoff rematch"). A neutral-site tag isn't repeated in a row that already says where it is.
  Counts from the real schedule: about 7–22% of a team's rows get a tag; the header shows the full set
  for the next game.
- **League file:** top-15 scorers by points per game (last season's, among players with 40+ games,
  until teams have played 10 games; then this season's) and each team's wins last season.
- The static pages (SEO snapshots) don't show tags yet.

---

## Original draft

The draft the owner approved, October 20, 2026. A tag is a short,
verifiable fact about a game, shown where the injury pills used to be on the team page header.

## 1. Principles

1. **Every tag is a checkable fact** from data the site already loads. No opinion, no prediction, no
   odds. Never "must watch", "tanking", "MVP race", "upset alert", "revenge game" or "trap game".
2. **Selective.** A tag that's always there says nothing. Most games show none; that's fine.
3. **At most 2 per game**, picked by a fixed priority order, so the header stays calm.
4. **No new data or requests.** Tags are computed in the browser from the schedule, standings, last
   season's results, players and availability files already loaded. A pure function with tests.
5. **Shown before tip-off only**, like the injury pills were: once a game is live, the score matters.
6. **Plain text, no color meaning**, so they read the same in light and dark mode and on a screen reader.

## 2. Catalogue

"Share" is how many games it applies to: for rules that don't need standings, across the real 2026-27
schedule (1,200 games); for standings rules, from replaying last season (1,231 games) with standings
rebuilt from results.

| ID | Tag text (example) | Rule | Data used | Share | Verdict |
|---|---|---|---|---|---|
| M-01 | Elimination game · Game 7 | Playoff game whose label reads "Game 7", or where a team has 3 wins in the series | schedule `label`, `type` | playoffs only | Include (test with fixtures; first real use in April) |
| M-02 | Play-in game | `type` is play-in | schedule `type` | few | Include |
| M-03 | Both top-4 seeds | Both teams rank 1–4 in their own conference; each has played 15+ games | standings `conferenceRank` | 5.4% | Include |
| M-04 | Division lead on the line · 1 game apart | Teams ranked 1st and 2nd in the same division, 2 games apart or fewer | standings `divisionRank`, W-L | 0.6% | Include (rare, but a real stake) |
| M-05 | Play-in race | Same conference, both ranked 6–10 and within 2 games, 55+ games played | standings | 0.6% (late season) | Include |
| M-06 | Last season's playoff rematch · NYK won 4-0 | The teams met in last season's playoffs; shows the series result | last-season results (`type` playoffs) | 4% | **Include (best one)** |
| M-07 | Season opener · Home opener · Regular-season finale | First game, first home game, last game of the schedule | schedule order | 2% / 1% | Include |
| M-08 | NBA Cup · East Group C · Rivals Week · Neutral site: Mexico City · Christmas Day | The NBA's own schedule label, or the date (Dec 25 ET) | schedule `label`, `neutralSite`, date | Cup 5%, Rivals ~1%, Christmas 5 games | Include |
| M-09 | Top-10 scorers: Jokić, Gilgeous-Alexander | Each team has one of the league's top-10 per-game scorers (min. 40 games), from last season until this season has 10+ games | players stats (all 30 rosters) | 8% | Include; list the names, ppg in the tooltip |
| M-10 | Curry is day-to-day | A top-15 scorer on either team is listed Out or Day-to-day and his return date is after tip-off | availability + players stats | ~0-1% (a few days a month) | **Include: this is what the pills were really for** |
| M-11 | Hot streaks: DEN W6, OKC W5 · OKC has won 9 straight | A team on 8+ straight wins, both on 5+, or a 6+ streak against a 4+ losing streak; 15+ games played | standings `streak` | 3.7% | Include |
| M-12 | Both won 50+ games last season | Both teams won 50 or more regular-season games last season; only until 20 games are played, when M-03 takes over | last-season results | 8% early on | Maybe (a stand-in for the early weeks) |

**Considered and left out as tags**

- "Second night of a back-to-back" (31% of games) and "Division game" (20%): true, but too common to
  stand out, and the first reads as betting context. Could be one plain line in a game's details later.
- Anything needing data we don't have: injuries to a team's *minutes* leaders, award odds, ratings,
  attendance, ticket demand, national-TV score.

## 3. Display rules

- **Priority** (first two that fire): M-01/02 playoff stakes → M-03/04/05 standings stakes → M-06
  rematch → M-10 star availability → M-07/08 openers and events → M-09 scoring stars → M-11 streaks →
  M-12.
- **Wording:** short facts, sentence case, no exclamation marks, no emoji. A tag may carry a tooltip
  and screen-reader text with the numbers ("Jokić 27.7, Gilgeous-Alexander 31.1 points per game last
  season").
- **Where:** the header slot (team page, next game), plus the game's row in the list on the team page.
  Optionally the game page. Never in the sitemap or titles.
- **Same facts everywhere:** the static page snapshot (SEO) could show the same tags as plain text.

## 4. Results of the dry run (real data, no site change)

- **2026-27 schedule, rules that don't need standings:** 59% of games would get at least one tag, but
  25% get a *headline* tag once back-to-back and division games are excluded. By month: Oct 56%,
  Nov 34%, Dec–Mar 16–19%, Apr 34%.
- **Last-season replay, standings rules only:** 9% of games get one (Oct 0%, Dec 10%, Feb–Apr 13–15%).
  Together with the above, in-season games would be about 20-30%: *most games show nothing.*
- **First real days:** Nuggets at Thunder → "Season opener · Top-10 scorers: Jokić, Gilgeous-Alexander".
  Knicks vs 76ers → "Last season's playoff rematch · NYK won 4-0" (it was a 4-0 sweep). Lakers vs
  Warriors → "Season and home opener · Curry is day-to-day".
- **Misses I found:** none of the rules overlap in confusing ways, but "Season opener" and "Home
  opener" both fire on a team's first game when it's at home, so they must merge into one tag.

## 5. Risks and limits

- **"Top scorer" is last season's per-game average**, for current rostered players with 40+ games, so
  traded players follow their new team, but rookies and anyone who left the league aren't ranked.
  The thresholds (top 10, top 4, 6-game streaks) are judgment calls; they're stated in the tag's
  tooltip and can be changed in one place.
- **Star availability depends on the hourly injury data**, so it can be up to an hour behind ESPN.
  The tag shows ESPN's wording and, like today's injury report, links to the game's full report.
- **Label text comes from the NBA's feed**, so a renamed event changes the tag text, not the logic.
- **Fan sensitivity:** facts about *other* teams' stars being out are fine; facts about the followed
  team being weak ("last in the conference") are deliberately not tags.
- **Playoff tags (M-01, M-02) can't be tested on real games until April**: fixtures only.

## 6. Decisions for the owner

1. **D1.** Which tags go in version 1? (Suggested: M-06, M-07, M-08, M-09, M-10 now, since they work
   today; M-03/04/05/11 turn on by themselves once standings fill in; M-12 only if early weeks feel empty.)
2. **D2.** Cap of two, in the priority order above?
3. **D3.** Thresholds: top-10 scorers, top-4 seeds, 6-game streak, 50-win teams.
4. **D4.** Placement: header only, or also each game row in the list?
5. **D5.** Show star availability for the opponent's star as well as the followed team's? (Suggested: yes.)

## 7. If approved: scope

A pure `src/lib/tags.ts` (rules, priority, tests for each rule and the cap), a small `MatchupTags`
component in the header and the game row, a build check that the static page shows the same tags,
screenshots on phone and desktop, and the usual contrast and layout-shift checks. Estimated effort: medium.
