// Name matching across sources (basketball-reference, ESPN), which differ in accents and suffixes.

/** Match names across sources: no accents, punctuation or suffixes like Jr./II. */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/, '')
    .replace(/[^a-z]+/g, ' ')
    .trim()
}

/**
 * Player ids by name key, for linking a name in another source (a box score, an injury report) to
 * a player page. A name two players share is left out, so a link never goes to the wrong player.
 */
export function idsByName(players: { id: string; name: string }[]): Map<string, string> {
  const ids = new Map<string, string>()
  const shared = new Set<string>()
  for (const p of players) {
    const key = nameKey(p.name)
    if (ids.has(key)) shared.add(key)
    else ids.set(key, p.id)
  }
  for (const key of shared) ids.delete(key)
  return ids
}
