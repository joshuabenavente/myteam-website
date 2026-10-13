# Data sources

Chosen from the phase 1 probe (`scripts/probe-sources.ts`), run from GitHub Actions on 2026-10-13.

| Need | Source | Notes |
|---|---|---|
| Schedule, UTC tip times, home/away | NBA CDN `scheduleLeagueV2.json` | Needs `Referer`/`Origin: https://www.nba.com` or it returns 403. Game IDs give season type (see `src/lib/season.ts`). |
| TV / streaming | NBA CDN (same file) | Every DEN game has broadcasters, including Altitude (`ALT/ALT+/KTVD`, `ALT2/ALT+`, `Altitude/Altitude+`, sometimes with KUSA). The broadcaster lists include the opponent's local TV too, so take national + Denver's side (home or away) only. |
| Standings, division rank, records | ESPN `apis/v2/.../standings?level=3` | Grouped by conference, then division. |
| Head-to-head, last season | ESPN team schedule `?season=<endYear>&seasontype=2` / `3` | Includes scores; regular and playoffs fetched separately. basketball-reference `<team>/<year>_games.html` is the fallback. |
| Roster and season stats | basketball-reference team page `teams/DEN/<endYear>.html` | Tables `roster`, `per_game_stats`, `per_game_stats_post`. The current season's `per_game_stats` only appears once games are played. |
| Stats "at the same point" last season | basketball-reference `players/<x>/<id>/gamelog/<endYear>` | Tables `player_game_log_reg`, `player_game_log_post`. Requests spaced 4s apart. |

**Rejected:** stats.nba.com times out from GitHub Actions runners (all three endpoints hung).

**Notes:**
- The NBA schedule lists 80 regular season games until NBA Cup group play finishes and the last 2 games are added. Ingest should run regularly and not assume 82.
- ESPN's current-season schedule only lists national TV, which is another reason to take broadcasts from the NBA CDN.
