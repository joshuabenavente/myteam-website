# Nuggets Tracker

A small static web app for following the Denver Nuggets: upcoming games (list and calendar views) and a player stat tracker that compares this season to last season.

## How it works

A scheduled job fetches schedule, standings and player stats and writes JSON into the repo. The frontend (Vite + React + TypeScript) only reads that JSON, so the sports sites are never hit on page load.

- Game times are stored in UTC and shown in the viewer's time zone.
- Only regular season and playoff games are tracked, and each is compared with the same game type from last season (no preseason, play-in, All-Star or Cup final).
- "Same point last season" means the same number of team games played, not the same calendar date.
- The local TV carrier is Altitude (`src/lib/config.ts`).

## Development

Requires Node 22.18+ (scripts run as TypeScript directly via Node's type stripping).

```sh
npm install
npm run dev      # start the app
npm test         # unit tests
npm run lint
npm run build
npm run probe    # check which data sources respond (writes probe-report.md)
npm run ingest   # refresh public/data (add -- --players for player stats)
```

## Roadmap

1. **Data source probe** ✅: the `Probe data sources` workflow runs `scripts/probe-sources.ts` on GitHub Actions and posts a report to the run summary.
2. **Ingest** ✅: `scripts/ingest.ts` writes schedule, standings, head-to-head and player stats to `public/data/`, refreshed by the `Update data` workflow. See [docs/data-sources.md](docs/data-sources.md).
3. **Games list view** ✅
4. **Calendar view** ✅
5. **Player tracker** ✅ with full last season and same-point-last-season comparisons, regular season and playoffs separate.
6. **Game availability & previews**, shown when a game is expanded, for the next 3 upcoming games:
   - *Not available* list for both teams (status: Out / Doubtful / Questionable / Probable / Day-To-Day, plus reason: injury, illness, personal, G League, not with team), from ESPN's injuries feed, refreshed hourly and labelled with when it was last updated.
   - A ~3-sentence preview written by Claude during the data job from facts the app already has: records, standings, streaks, last 10, home/away records, season series, last meeting and who's out. It uses only those facts and regenerates only when they change. Needs an `ANTHROPIC_API_KEY` repository secret.
   - First step: probe the injury sources from GitHub Actions, as in phase 1.
7. Polish.

The site deploys to GitHub Pages (`.github/workflows/deploy.yml`) on every push and after each data refresh: https://joshuabenavente.github.io/nuggets-tracker/

Player stats preferably come from [Basketball-Reference](https://www.basketball-reference.com), fetched at most a few times a day and well under their rate limit.
