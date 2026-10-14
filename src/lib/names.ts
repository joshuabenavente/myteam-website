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
