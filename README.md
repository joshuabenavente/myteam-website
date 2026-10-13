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
```

## Roadmap

1. **Data source probe**: the `Probe data sources` workflow runs `scripts/probe-sources.ts` on GitHub Actions and posts a report to the run summary.
2. Ingest scripts: schedule, standings, head-to-head and player stats JSON.
3. Games list view.
4. Calendar view.
5. Player tracker with season, full last season and same-point-last-season comparisons.
6. Polish and the scheduled data refresh plus deploy.

Player stats preferably come from [Basketball-Reference](https://www.basketball-reference.com), fetched at most a few times a day and well under their rate limit.
