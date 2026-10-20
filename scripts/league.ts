// Write public/data/league.json from the files already there (no requests):
//   node scripts/league.ts
// The hourly data run (scripts/ingest.ts) does this too.

import { previousSeason, seasonForDate } from '../src/lib/season.ts'
import { writeLeagueFile } from './lib/league.ts'

const current = seasonForDate(new Date())
writeLeagueFile('public/data', { current: current.label, last: previousSeason(current).label })
