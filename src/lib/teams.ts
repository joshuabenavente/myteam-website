// Static NBA team reference data, keyed by NBA tricode (the app's canonical team key).

export type Conference = 'East' | 'West'

export interface Team {
  abbr: string
  nbaId: number
  city: string
  name: string
  conference: Conference
  division: string
  /** ESPN's abbreviation where it differs from the NBA tricode. */
  espnAbbr?: string
}

const t = (
  abbr: string,
  nbaId: number,
  city: string,
  name: string,
  conference: Conference,
  division: string,
  espnAbbr?: string,
): Team => ({ abbr, nbaId, city, name, conference, division, espnAbbr })

export const TEAMS: Team[] = [
  t('BOS', 1610612738, 'Boston', 'Celtics', 'East', 'Atlantic'),
  t('BKN', 1610612751, 'Brooklyn', 'Nets', 'East', 'Atlantic'),
  t('NYK', 1610612752, 'New York', 'Knicks', 'East', 'Atlantic', 'NY'),
  t('PHI', 1610612755, 'Philadelphia', '76ers', 'East', 'Atlantic'),
  t('TOR', 1610612761, 'Toronto', 'Raptors', 'East', 'Atlantic'),
  t('CHI', 1610612741, 'Chicago', 'Bulls', 'East', 'Central'),
  t('CLE', 1610612739, 'Cleveland', 'Cavaliers', 'East', 'Central'),
  t('DET', 1610612765, 'Detroit', 'Pistons', 'East', 'Central'),
  t('IND', 1610612754, 'Indiana', 'Pacers', 'East', 'Central'),
  t('MIL', 1610612749, 'Milwaukee', 'Bucks', 'East', 'Central'),
  t('ATL', 1610612737, 'Atlanta', 'Hawks', 'East', 'Southeast'),
  t('CHA', 1610612766, 'Charlotte', 'Hornets', 'East', 'Southeast'),
  t('MIA', 1610612748, 'Miami', 'Heat', 'East', 'Southeast'),
  t('ORL', 1610612753, 'Orlando', 'Magic', 'East', 'Southeast'),
  t('WAS', 1610612764, 'Washington', 'Wizards', 'East', 'Southeast', 'WSH'),
  t('DEN', 1610612743, 'Denver', 'Nuggets', 'West', 'Northwest'),
  t('MIN', 1610612750, 'Minnesota', 'Timberwolves', 'West', 'Northwest'),
  t('OKC', 1610612760, 'Oklahoma City', 'Thunder', 'West', 'Northwest'),
  t('POR', 1610612757, 'Portland', 'Trail Blazers', 'West', 'Northwest'),
  t('UTA', 1610612762, 'Utah', 'Jazz', 'West', 'Northwest', 'UTAH'),
  t('GSW', 1610612744, 'Golden State', 'Warriors', 'West', 'Pacific', 'GS'),
  t('LAC', 1610612746, 'LA', 'Clippers', 'West', 'Pacific'),
  t('LAL', 1610612747, 'Los Angeles', 'Lakers', 'West', 'Pacific'),
  t('PHX', 1610612756, 'Phoenix', 'Suns', 'West', 'Pacific'),
  t('SAC', 1610612758, 'Sacramento', 'Kings', 'West', 'Pacific'),
  t('DAL', 1610612742, 'Dallas', 'Mavericks', 'West', 'Southwest'),
  t('HOU', 1610612745, 'Houston', 'Rockets', 'West', 'Southwest'),
  t('MEM', 1610612763, 'Memphis', 'Grizzlies', 'West', 'Southwest'),
  t('NOP', 1610612740, 'New Orleans', 'Pelicans', 'West', 'Southwest', 'NO'),
  t('SAS', 1610612759, 'San Antonio', 'Spurs', 'West', 'Southwest', 'SA'),
]

export const TEAMS_BY_ABBR: { [abbr: string]: Team } = Object.fromEntries(TEAMS.map((x) => [x.abbr, x]))

/** The team's address on the site: "denver-nuggets", "la-clippers", "philadelphia-76ers". */
export const teamSlug = (t: Pick<Team, 'city' | 'name'>) => `${t.city} ${t.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export const TEAMS_BY_SLUG: { [slug: string]: Team } = Object.fromEntries(TEAMS.map((x) => [teamSlug(x), x]))

/** ESPN's lowercase team code for its URLs ("den", "gs", "utah"). */
export const espnSlug = (t: Pick<Team, 'abbr' | 'espnAbbr'>) => (t.espnAbbr ?? t.abbr).toLowerCase()

/** basketball-reference's team code where it differs from the NBA's. */
const BBREF: { [abbr: string]: string } = { BKN: 'BRK', CHA: 'CHO', PHX: 'PHO' }
export const bbrefAbbr = (abbr: string) => BBREF[abbr] ?? abbr

const BY_ESPN: { [abbr: string]: Team } = Object.fromEntries(TEAMS.map((x) => [x.espnAbbr ?? x.abbr, x]))

/** Map an ESPN team abbreviation to the NBA tricode, or undefined for non-NBA teams. */
export function fromEspnAbbr(espnAbbr: string): string | undefined {
  return BY_ESPN[espnAbbr]?.abbr
}

/** ESPN logo; the dark variant is drawn for dark backgrounds (e.g. a navy logo gets a light outline). */
export function teamLogoUrl(abbr: string, dark = false): string {
  const team = TEAMS_BY_ABBR[abbr]
  return `https://a.espncdn.com/i/teamlogos/nba/${dark ? '500-dark' : '500'}/${(team?.espnAbbr ?? abbr).toLowerCase()}.png`
}
