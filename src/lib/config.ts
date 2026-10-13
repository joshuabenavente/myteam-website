// Team-specific settings. Everything else in the app keys off these.
export const TEAM = {
  abbr: 'DEN',
  nbaTeamId: 1610612743,
  espnSlug: 'den',
  bbrefAbbr: 'DEN',
  name: 'Denver Nuggets',
  division: 'Northwest',
} as const

// Local TV carrier. The NBA/ESPN feeds don't always list regional networks,
// so we fall back to this for any game that isn't national-exclusive.
export const LOCAL_BROADCAST = 'Altitude'
