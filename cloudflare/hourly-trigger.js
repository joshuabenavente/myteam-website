// Cloudflare Worker that starts the "Update data" GitHub workflow every hour.
//
// GitHub's own scheduled runs are best effort and were skipping most hours, so this Worker's
// Cron Trigger (17 * * * *) asks GitHub to run the workflow instead, like clicking "Run workflow".
//
// Setup (Cloudflare dashboard): paste this file as the Worker's code, add a secret named
// GITHUB_TOKEN (a fine-grained token for this repo with Actions: read and write), and add a
// Cron Trigger "17 * * * *". See docs/data-sources.md.

const WORKFLOW_URL =
  'https://api.github.com/repos/joshuabenavente/nuggets-tracker/actions/workflows/update-data.yml/dispatches'

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(startUpdate(env))
  },

  // Opening the Worker's address doesn't start anything, so nobody can trigger runs with it.
  async fetch() {
    return new Response('myteam.fans hourly data trigger. Runs on a schedule only.')
  },
}

async function startUpdate(env) {
  const res = await fetch(WORKFLOW_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'myteam-fans-hourly-trigger',
    },
    body: JSON.stringify({ ref: 'main' }),
  })
  // GitHub answers 204 No Content on success; anything else shows as a failed run in Cloudflare.
  if (res.status !== 204) throw new Error(`GitHub said ${res.status}: ${await res.text()}`)
}
