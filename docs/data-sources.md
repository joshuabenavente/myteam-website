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

| Who's not available | ESPN `apis/site/v2/sports/basketball/nba/injuries` | All 30 teams in one request: status (Out / Day-To-Day), game-time-decision flag, body part and injury type, expected return date. The NBA's official injury report is a PDF and its 2026-27 page wasn't up yet. |
| Live score (in the browser) | ESPN `apis/site/v2/sports/basketball/nba/scoreboard?dates=<YYYYMMDD Eastern>` | Fetched by the page, not by ingest: ESPN sends `Access-Control-Allow-Origin: *` (checked 2026-10-13); the NBA's `liveData` scoreboard returns 403 to other sites. Polled every 30 s from 15 min before tip-off until the final (4.5 h cap), only while the page is visible. `?live=<TEAM>` on the site watches another team's game today for testing. |
| Game page: box scores, play-by-play, injuries | ESPN `apis/site/v2/sports/basketball/nba/summary?event=<id>` | Also fetched by the page (`Access-Control-Allow-Origin: *`, checked 2026-10-13). The event ID comes from the scoreboard for the game's Eastern date. Refreshed every 20 s around the game; finished games load once. |
| Team colors | ESPN `apis/site/v2/sports/basketball/nba/teams` (`color`, `alternateColor`) | Copied into `src/lib/teamColors.ts` (2026-10-13). |

**Rejected:** stats.nba.com times out from GitHub Actions runners (all three endpoints hung).

**Notes:**
- The NBA schedule lists 80 regular season games until NBA Cup group play finishes and the last 2 games are added. Ingest should run regularly and not assume 82.
- ESPN's current-season schedule only lists national TV, which is another reason to take broadcasts from the NBA CDN.
- ESPN uses its own abbreviations (`GS`, `NY`, `NO`, `SA`, `UTAH`, `WSH`); `src/lib/teams.ts` maps them to NBA tricodes, which are the app's team keys.

## Refresh schedule

The `Update data` workflow (`.github/workflows/update-data.yml`) runs `scripts/ingest.ts` hourly, for all 30 teams. It's started by a Cloudflare Worker (`cloudflare/hourly-trigger.js`, Cron Trigger `17 * * * *`) using a fine-grained token limited to this repo's Actions. GitHub's own schedule was best effort and skipped most hours, so the workflow no longer has one; if the Worker stops, data stops refreshing until it's fixed or the workflow is started by hand (Actions → Update data → Run workflow). Each run:

- shared files in `public/data/`: standings, injuries (one ESPN request covers every team) and meta
- per team in `public/data/teams/<abbr>/`: schedule, head-to-head, and a preview of the team's next game when `ANTHROPIC_API_KEY` is set (Claude Haiku 5.5, rewritten only when the facts change)
- player stats for the 5 teams refreshed longest ago, so each team comes round about every 6 hours. basketball-reference asks for under 20 requests a minute; requests are 4 seconds apart. Last season's game logs and results are cached in `data/cache/` and fetched once.

A manual run can refresh every team's players (`all_players`). Output types are in `src/lib/types.ts`; files are committed only when something other than `meta.json` changed.
