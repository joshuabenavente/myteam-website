// Fetch helpers. basketball-reference requests are serialized and spaced out to stay
// well under their 20 requests/minute bot limit.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

export const NBA_HEADERS = { Referer: 'https://www.nba.com/', Origin: 'https://www.nba.com' }

export class HttpError extends Error {
  readonly status: number

  constructor(url: string, status: number) {
    super(`HTTP ${status} for ${url}`)
    this.status = status
  }
}

/** Network failures (not HTTP errors) are retried once after a short pause. */
const RETRY_AFTER_MS = 5000

export async function getText(url: string, headers: Record<string, string> = {}): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, ...headers },
        signal: AbortSignal.timeout(30_000),
      })
    } catch (err) {
      if (attempt >= 2) throw err
      console.warn(`  retrying ${url}: ${(err as Error).message}`)
      await new Promise((r) => setTimeout(r, RETRY_AFTER_MS))
      continue
    }
    if (!res.ok) throw new HttpError(url, res.status)
    return res.text()
  }
}

export async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  return JSON.parse(await getText(url, headers)) as T
}

const BBREF_SPACING_MS = 4000
let nextBbrefAt = 0

/** Fetch a basketball-reference page; returns undefined for 404 (e.g. a player with no games that season). */
export async function getBbref(url: string): Promise<string | undefined> {
  const wait = nextBbrefAt - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  nextBbrefAt = Date.now() + BBREF_SPACING_MS
  try {
    return await getText(url)
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return undefined
    throw err
  }
}
