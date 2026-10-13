# Data sources

Chosen from the phase 1 probe (`scripts/probe-sources.ts`), run from GitHub Actions on 2026-10-13.

| Need | Source | Notes |
|---|---|---|
| Schedule, UTC tip times, home/away | NBA CDN `scheduleLeagueV2.json` | Needs `Referer`/`Origin: https://www.nba.com` or it returns 403, and blocks `curl` outright (Node's `fetch` works). Game IDs give season type (see `src/lib/season.ts`). |
| TV / streaming | NBA CDN (same file) | Every DEN game has broadcasters, including Altitude (`ALT/ALT+/KTVD`, `ALT2/ALT+`, `Altitude/Altitude+`, sometimes with KUSA). The broadcaster lists include the opponent's local TV too, so take national + Denver's side (home or away) only. |
| Standings, division rank, records | Calculated from the NBA CDN schedule (`scripts/lib/standings.ts`) | ESPN's standings count preseason games before the season starts, so they aren't used. Ties use a simplified version of the NBA tiebreakers. |
| Head-to-head | This season: NBA CDN schedule. Last season: ESPN team schedule `?season=<endYear>&seasontype=2` / `3` | Includes scores; regular and playoffs fetched separately. basketball-reference `<team>/<year>_games.html` is the fallback. |
| Roster | basketball-reference team page `teams/DEN/<endYear>.html` | Table `roster` (includes two-way players). |
| Player stats (this season, last season, same point last season) | basketball-reference `players/<x>/<id>/gamelog/<endYear>` | Tables `player_game_log_reg`, `player_game_log_post`. Totals are summed from game logs, so stats from other teams are included. The cutoff uses the log's team-game-number column. |

**Rejected:** stats.nba.com times out from GitHub Actions runners (all three endpoints hung).

**Notes:**
- The NBA schedule lists 80 regular season games until NBA Cup group play finishes and the last 2 games are added. Ingest should run regularly and not assume 82.
- ESPN's current-season schedule only lists national TV, which is another reason to take broadcasts from the NBA CDN.
- ESPN uses its own abbreviations (`GS`, `NY`, `NO`, `SA`, `UTAH`, `WSH`); `src/lib/teams.ts` maps them to NBA tricodes, which are the app's team keys.

## Refresh schedule

The `Update data` workflow (`.github/workflows/update-data.yml`) runs `scripts/ingest.ts`:

- every 3 hours: schedule, standings, head-to-head (2 requests to NBA/ESPN)
- daily at 10:43 UTC (4:43am Mountain): also player stats. That's one roster page plus a game log per player for the current season, 4 seconds apart. Last season's game logs are cached in `data/cache/` and fetched only once per player.

Output goes to `public/data/*.json` (types in `src/lib/types.ts`), committed only when something other than `meta.json` changed.
